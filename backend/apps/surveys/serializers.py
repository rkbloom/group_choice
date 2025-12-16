"""
Serializers for the surveys app.
"""
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    Survey, SurveyChoice, SurveyResponse,
    RankedChoiceAnswer, FiveStonesAnswer, AnonymousInvitation
)
from apps.themes.serializers import ThemeSerializer
from apps.groups.serializers import DistributionGroupListSerializer


class SurveyChoiceSerializer(serializers.ModelSerializer):
    """Serializer for SurveyChoice model."""

    class Meta:
        model = SurveyChoice
        fields = ['id', 'text', 'order']
        read_only_fields = ['id']


class SurveySerializer(serializers.ModelSerializer):
    """Serializer for Survey model."""

    choices = SurveyChoiceSerializer(many=True, read_only=True)
    theme_data = ThemeSerializer(source='theme', read_only=True)
    distribution_group_data = DistributionGroupListSerializer(
        source='distribution_group', read_only=True
    )
    author_name = serializers.SerializerMethodField()
    response_count = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    share_url = serializers.ReadOnlyField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'question', 'description', 'survey_type',
            'author', 'author_name', 'distribution_group', 'distribution_group_data',
            'theme', 'theme_data', 'is_anonymous', 'results_public',
            'deadline', 'is_active', 'is_expired', 'response_count',
            'share_url', 'choices', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.full_name


class SurveyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating surveys."""

    choices = serializers.ListField(
        child=serializers.CharField(max_length=500),
        min_length=2,
        max_length=10,
        write_only=True
    )

    class Meta:
        model = Survey
        fields = [
            'title', 'question', 'description', 'survey_type',
            'distribution_group', 'theme', 'is_anonymous',
            'results_public', 'deadline', 'choices'
        ]

    def validate_choices(self, value):
        """Validate choices based on survey type."""
        survey_type = self.initial_data.get('survey_type', 'ranked_choice')

        if survey_type == 'five_stones':
            if len(value) != 3:
                raise serializers.ValidationError(
                    "5 Stones surveys must have exactly 3 choices."
                )
        else:
            if len(value) < 2:
                raise serializers.ValidationError(
                    "Ranked Choice surveys must have at least 2 choices."
                )
            if len(value) > 10:
                raise serializers.ValidationError(
                    "Ranked Choice surveys can have at most 10 choices."
                )

        return value

    def validate_distribution_group(self, value):
        """Validate that the user owns the distribution group."""
        if value and value.owner != self.context['request'].user:
            raise serializers.ValidationError(
                "You can only use your own distribution groups."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        choices_data = validated_data.pop('choices')
        validated_data['author'] = self.context['request'].user

        survey = Survey.objects.create(**validated_data)

        # Create choices
        for i, choice_text in enumerate(choices_data):
            SurveyChoice.objects.create(
                survey=survey,
                text=choice_text,
                order=i + 1
            )

        # Create anonymous invitations for non-registered group members
        if survey.distribution_group:
            from .utils import create_anonymous_invitations
            create_anonymous_invitations(survey)

        # Send notification emails
        from .utils import send_survey_notifications
        send_survey_notifications(survey, is_new=True)

        return survey


class SurveyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating surveys."""

    choices = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Survey
        fields = [
            'title', 'question', 'description',
            'distribution_group', 'theme', 'is_anonymous',
            'results_public', 'deadline', 'is_active', 'choices'
        ]

    def validate_choices(self, value):
        """Validate choices based on survey type."""
        survey = self.instance
        survey_type = survey.survey_type

        if survey_type == 'five_stones':
            if len(value) != 3:
                raise serializers.ValidationError(
                    "5 Stones surveys must have exactly 3 choices."
                )
        else:
            if len(value) < 2:
                raise serializers.ValidationError(
                    "Ranked Choice surveys must have at least 2 choices."
                )
            if len(value) > 10:
                raise serializers.ValidationError(
                    "Ranked Choice surveys can have at most 10 choices."
                )

        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)

        # Update survey fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update choices if provided
        if choices_data is not None:
            # Delete existing choices
            instance.choices.all().delete()

            # Create new choices
            for i, choice_data in enumerate(choices_data):
                SurveyChoice.objects.create(
                    survey=instance,
                    text=choice_data.get('text', ''),
                    order=i + 1
                )

        # Send update notifications
        from .utils import send_survey_notifications
        send_survey_notifications(instance, is_new=False)

        return instance


class SurveyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for survey listings."""

    author_name = serializers.SerializerMethodField()
    response_count = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'survey_type', 'author', 'author_name',
            'is_anonymous', 'results_public', 'deadline',
            'is_active', 'is_expired', 'response_count', 'created_at'
        ]

    def get_author_name(self, obj):
        return obj.author.full_name


class RankedChoiceAnswerSerializer(serializers.Serializer):
    """Serializer for ranked choice answers."""

    choice_id = serializers.UUIDField()
    rank = serializers.IntegerField(min_value=1, max_value=10)


class FiveStonesAnswerSerializer(serializers.Serializer):
    """Serializer for 5 stones answers."""

    choice_id = serializers.UUIDField()
    stones = serializers.IntegerField(min_value=0, max_value=5)


class SurveyResponseCreateSerializer(serializers.Serializer):
    """Serializer for submitting survey responses."""

    ranked_answers = RankedChoiceAnswerSerializer(many=True, required=False)
    stones_answers = FiveStonesAnswerSerializer(many=True, required=False)
    token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        survey = self.context['survey']
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        token = attrs.get('token')

        # Check if survey is active and not expired
        if not survey.is_active:
            raise serializers.ValidationError("This survey is no longer active.")
        if survey.is_expired:
            raise serializers.ValidationError("This survey has expired.")

        # Validate based on survey type
        if survey.survey_type == Survey.SurveyType.RANKED_CHOICE:
            if 'ranked_answers' not in attrs or not attrs['ranked_answers']:
                raise serializers.ValidationError(
                    "Ranked answers are required for this survey type."
                )
            self._validate_ranked_answers(attrs['ranked_answers'], survey)
        else:
            if 'stones_answers' not in attrs or not attrs['stones_answers']:
                raise serializers.ValidationError(
                    "Stones answers are required for this survey type."
                )
            self._validate_stones_answers(attrs['stones_answers'], survey)

        # Check for duplicate responses
        if token:
            invitation = AnonymousInvitation.objects.filter(
                survey=survey,
                token=token,
                is_used=False
            ).first()
            if not invitation:
                raise serializers.ValidationError(
                    "Invalid or already used invitation token."
                )
            attrs['invitation'] = invitation
        elif user:
            if SurveyResponse.objects.filter(survey=survey, user=user).exists():
                raise serializers.ValidationError(
                    "You have already responded to this survey."
                )
        else:
            raise serializers.ValidationError(
                "Authentication or invitation token is required."
            )

        return attrs

    def _validate_ranked_answers(self, answers, survey):
        """Validate ranked choice answers."""
        choice_ids = set(survey.choices.values_list('id', flat=True))
        answer_choice_ids = set()
        ranks = set()

        for answer in answers:
            choice_id = answer['choice_id']
            rank = answer['rank']

            if choice_id not in choice_ids:
                raise serializers.ValidationError(
                    f"Invalid choice ID: {choice_id}"
                )
            if choice_id in answer_choice_ids:
                raise serializers.ValidationError(
                    "Each choice can only be ranked once."
                )
            if rank in ranks:
                raise serializers.ValidationError(
                    "Each rank can only be used once."
                )

            answer_choice_ids.add(choice_id)
            ranks.add(rank)

        if len(answers) != len(choice_ids):
            raise serializers.ValidationError(
                "All choices must be ranked."
            )

    def _validate_stones_answers(self, answers, survey):
        """Validate 5 stones answers."""
        choice_ids = set(survey.choices.values_list('id', flat=True))
        answer_choice_ids = set()
        total_stones = 0

        for answer in answers:
            choice_id = answer['choice_id']
            stones = answer['stones']

            if choice_id not in choice_ids:
                raise serializers.ValidationError(
                    f"Invalid choice ID: {choice_id}"
                )
            if choice_id in answer_choice_ids:
                raise serializers.ValidationError(
                    "Each choice can only have one stone allocation."
                )

            answer_choice_ids.add(choice_id)
            total_stones += stones

        if total_stones != 5:
            raise serializers.ValidationError(
                f"Total stones must equal 5. You allocated {total_stones}."
            )

        if len(answers) != len(choice_ids):
            raise serializers.ValidationError(
                "All choices must have stone allocations."
            )

    @transaction.atomic
    def create(self, validated_data):
        survey = self.context['survey']
        request = self.context['request']
        user = request.user if request.user.is_authenticated else None
        invitation = validated_data.get('invitation')

        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        # Create response record
        response = SurveyResponse.objects.create(
            survey=survey,
            user=user if not survey.is_anonymous else None,
            anonymous_email=invitation.email if invitation else '',
            ip_address=ip_address if not survey.is_anonymous else None
        )

        # Create answers
        if survey.survey_type == Survey.SurveyType.RANKED_CHOICE:
            for answer_data in validated_data['ranked_answers']:
                RankedChoiceAnswer.objects.create(
                    response=response,
                    choice_id=answer_data['choice_id'],
                    rank=answer_data['rank']
                )
        else:
            for answer_data in validated_data['stones_answers']:
                FiveStonesAnswer.objects.create(
                    response=response,
                    choice_id=answer_data['choice_id'],
                    stones=answer_data['stones']
                )

        # Mark invitation as used
        if invitation:
            invitation.mark_used()
        elif user:
            # Also mark any invitation for this user's email as used
            # This prevents double-responding via token after responding while logged in
            AnonymousInvitation.objects.filter(
                survey=survey,
                email__iexact=user.email,
                is_used=False
            ).update(is_used=True, used_at=timezone.now())

        return response


class SurveyResponseSerializer(serializers.ModelSerializer):
    """Serializer for viewing survey responses."""

    user_name = serializers.SerializerMethodField()
    ranked_answers = serializers.SerializerMethodField()
    stones_answers = serializers.SerializerMethodField()

    class Meta:
        model = SurveyResponse
        fields = [
            'id', 'user', 'user_name', 'anonymous_email',
            'submitted_at', 'ranked_answers', 'stones_answers'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.full_name
        return None

    def get_ranked_answers(self, obj):
        answers = obj.ranked_answers.select_related('choice').all()
        return [
            {'choice': answer.choice.text, 'rank': answer.rank}
            for answer in answers
        ]

    def get_stones_answers(self, obj):
        answers = obj.stones_answers.select_related('choice').all()
        return [
            {'choice': answer.choice.text, 'stones': answer.stones}
            for answer in answers
        ]


class AnonymousInvitationSerializer(serializers.ModelSerializer):
    """Serializer for AnonymousInvitation model."""

    survey_url = serializers.ReadOnlyField()
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = AnonymousInvitation
        fields = [
            'id', 'email', 'is_used', 'is_valid',
            'survey_url', 'created_at', 'expires_at'
        ]


class SurveyResultsSerializer(serializers.Serializer):
    """Serializer for survey results."""

    type = serializers.CharField()
    method = serializers.CharField(required=False)
    total_responses = serializers.IntegerField()
    total_stones = serializers.IntegerField(required=False)
    results = serializers.ListField()
