"""
Distribution Group models for Group Choice application.
"""
import uuid
from django.db import models
from django.conf import settings


class DistributionGroup(models.Model):
    """Distribution Group model for reusable survey distribution lists."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_distribution_groups'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'distribution_groups'
        ordering = ['name']
        unique_together = ['name', 'owner']

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

    @property
    def member_count(self):
        """Return the count of members in this group."""
        return self.members.count()

    def add_member(self, email, user=None):
        """Add a member to the group by email."""
        member, created = GroupMember.objects.get_or_create(
            group=self,
            email=email.lower(),
            defaults={'user': user}
        )
        if not created and user and not member.user:
            member.user = user
            member.save()
        return member

    def remove_member(self, email):
        """Remove a member from the group by email."""
        self.members.filter(email=email.lower()).delete()


class GroupMember(models.Model):
    """Member of a Distribution Group."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(
        DistributionGroup,
        on_delete=models.CASCADE,
        related_name='members'
    )
    email = models.EmailField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='distribution_group_memberships'
    )

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_members'
        ordering = ['email']
        unique_together = ['group', 'email']

    def __str__(self):
        if self.user:
            return f"{self.user.full_name} ({self.email})"
        return self.email

    @property
    def is_registered(self):
        """Check if this member has a registered account."""
        return self.user is not None

    def save(self, *args, **kwargs):
        """Normalize email and try to link to existing user."""
        self.email = self.email.lower()

        # Try to link to existing user if not already linked
        if not self.user:
            from apps.users.models import User
            try:
                self.user = User.objects.get(email=self.email)
            except User.DoesNotExist:
                pass

        super().save(*args, **kwargs)
