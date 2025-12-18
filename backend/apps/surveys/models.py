"""
Survey models for Group Choice application.
"""
import uuid
import secrets
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Survey(models.Model):
    """Survey model supporting Ranked Choice and 5 Stones types."""

    class SurveyType(models.TextChoices):
        RANKED_CHOICE = 'ranked_choice', 'Ranked Choice'
        FIVE_STONES = 'five_stones', '5 Stones'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    question = models.TextField()
    description = models.TextField(blank=True)

    survey_type = models.CharField(
        max_length=20,
        choices=SurveyType.choices,
        default=SurveyType.RANKED_CHOICE
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='authored_surveys'
    )

    distribution_group = models.ForeignKey(
        'groups.DistributionGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='surveys'
    )

    theme = models.ForeignKey(
        'themes.Theme',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='surveys'
    )

    # Survey settings
    is_anonymous = models.BooleanField(
        default=False,
        help_text='If true, individual responses are not tracked'
    )
    results_public = models.BooleanField(
        default=False,
        help_text='If true, survey takers can see aggregated results'
    )
    deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Deadline for survey responses'
    )

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'surveys'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_survey_type_display()})"

    @property
    def is_expired(self):
        """Check if the survey deadline has passed."""
        if self.deadline:
            return timezone.now() > self.deadline
        return False

    @property
    def response_count(self):
        """Get the count of responses."""
        return self.responses.count()

    @property
    def share_url(self):
        """Get the shareable URL for this survey."""
        return f"{settings.FRONTEND_URL}/survey/{self.id}"

    def can_respond(self, user=None, token=None):
        """Check if a user or anonymous token can respond."""
        if not self.is_active or self.is_expired:
            return False

        if token:
            # Check anonymous invitation
            invitation = self.anonymous_invitations.filter(
                token=token,
                is_used=False
            ).first()
            return invitation is not None

        if user:
            # Check if user already responded
            return not self.responses.filter(user=user).exists()

        return False

    def get_results(self):
        """Calculate and return survey results."""
        if self.survey_type == self.SurveyType.RANKED_CHOICE:
            return self._calculate_borda_count()
        else:
            return self._calculate_five_stones_results()

    def _calculate_borda_count(self):
        """Calculate results using Borda count method."""
        choices = list(self.choices.values_list('id', 'text'))
        choice_count = len(choices)
        scores = {str(choice[0]): {'text': choice[1], 'score': 0, 'rankings': []} for choice in choices}

        responses = RankedChoiceAnswer.objects.filter(
            response__survey=self
        ).select_related('choice')

        for answer in responses:
            choice_id = str(answer.choice_id)
            # Borda count: highest rank (1) gets most points
            points = choice_count - answer.rank + 1
            scores[choice_id]['score'] += points
            scores[choice_id]['rankings'].append(answer.rank)

        # Sort by score descending
        sorted_results = sorted(
            scores.values(),
            key=lambda x: x['score'],
            reverse=True
        )

        return {
            'type': 'ranked_choice',
            'method': 'borda_count',
            'total_responses': self.response_count,
            'results': sorted_results
        }

    def _calculate_five_stones_results(self):
        """Calculate results for 5 Stones survey."""
        choices = list(self.choices.values_list('id', 'text'))
        scores = {str(choice[0]): {'text': choice[1], 'stones': 0, 'distribution': []} for choice in choices}

        responses = FiveStonesAnswer.objects.filter(
            response__survey=self
        ).select_related('choice')

        for answer in responses:
            choice_id = str(answer.choice_id)
            scores[choice_id]['stones'] += answer.stones
            scores[choice_id]['distribution'].append(answer.stones)

        # Sort by stones descending
        sorted_results = sorted(
            scores.values(),
            key=lambda x: x['stones'],
            reverse=True
        )

        return {
            'type': 'five_stones',
            'total_responses': self.response_count,
            'total_stones': self.response_count * 5,
            'results': sorted_results
        }


class SurveyChoice(models.Model):
    """Choice option for a survey."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='choices'
    )
    text = models.CharField(max_length=500)
    url = models.URLField(
        max_length=500,
        blank=True,
        help_text='Optional URL to make this choice a clickable link'
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'survey_choices'
        ordering = ['order']
        unique_together = ['survey', 'order']

    def __str__(self):
        return f"{self.survey.title}: {self.text}"


class SurveyResponse(models.Model):
    """Track survey responses (who submitted)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='survey_responses'
    )
    anonymous_email = models.EmailField(
        blank=True,
        help_text='Email for anonymous responses'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'survey_responses'
        ordering = ['-submitted_at']

    def __str__(self):
        if self.user:
            return f"{self.survey.title} - {self.user.username}"
        return f"{self.survey.title} - {self.anonymous_email or 'Anonymous'}"


class RankedChoiceAnswer(models.Model):
    """Individual ranked choice answer."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(
        SurveyResponse,
        on_delete=models.CASCADE,
        related_name='ranked_answers'
    )
    choice = models.ForeignKey(
        SurveyChoice,
        on_delete=models.CASCADE,
        related_name='ranked_answers'
    )
    rank = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )

    class Meta:
        db_table = 'ranked_choice_answers'
        unique_together = ['response', 'choice']
        ordering = ['rank']

    def __str__(self):
        return f"{self.response} - {self.choice.text}: Rank {self.rank}"


class FiveStonesAnswer(models.Model):
    """Individual 5 stones answer."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(
        SurveyResponse,
        on_delete=models.CASCADE,
        related_name='stones_answers'
    )
    choice = models.ForeignKey(
        SurveyChoice,
        on_delete=models.CASCADE,
        related_name='stones_answers'
    )
    stones = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )

    class Meta:
        db_table = 'five_stones_answers'
        unique_together = ['response', 'choice']

    def __str__(self):
        return f"{self.response} - {self.choice.text}: {self.stones} stones"


class AnonymousInvitation(models.Model):
    """One-time use invitation for anonymous survey takers."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='anonymous_invitations'
    )
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, editable=False)

    # Link to user if they create an account
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anonymous_invitations'
    )

    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'anonymous_invitations'
        unique_together = ['survey', 'email']

    def __str__(self):
        return f"{self.survey.title} - {self.email}"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        self.email = self.email.lower()
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        """Check if invitation is still valid."""
        if self.is_used:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def mark_used(self):
        """Mark the invitation as used."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()

    @property
    def survey_url(self):
        """Get the survey URL with token."""
        return f"{settings.FRONTEND_URL}/survey/{self.survey_id}?token={self.token}"
