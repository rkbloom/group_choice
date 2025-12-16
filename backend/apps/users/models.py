"""
User models for Group Choice application.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for User model."""

    def create_user(self, email, username, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('permission_level', User.PermissionLevel.SUPER)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with permission levels."""

    class PermissionLevel(models.TextChoices):
        USER = 'user', 'User'
        ADMIN = 'admin', 'Admin'
        SUPER = 'super', 'Super'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    permission_level = models.CharField(
        max_length=10,
        choices=PermissionLevel.choices,
        default=PermissionLevel.USER
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    def is_super(self):
        """Check if user has super permission level."""
        return self.permission_level == self.PermissionLevel.SUPER

    def is_admin(self):
        """Check if user has admin or super permission level."""
        return self.permission_level in [self.PermissionLevel.ADMIN, self.PermissionLevel.SUPER]

    def can_manage_users(self):
        """Check if user can manage other users."""
        return self.is_admin()

    def can_manage_themes(self):
        """Check if user can manage themes."""
        return self.is_admin()

    def can_delete_any(self):
        """Check if user can delete any resource."""
        return self.is_super()
