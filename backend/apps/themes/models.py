"""
Theme models for Group Choice application.
"""
import uuid
from django.db import models
from django.core.validators import RegexValidator


hex_color_validator = RegexValidator(
    regex=r'^#[0-9A-Fa-f]{6}$',
    message='Enter a valid hex color code (e.g., #FF5733)'
)


class Theme(models.Model):
    """Theme model for survey styling."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    # Color scheme
    primary_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#4A5568',
        help_text='Primary brand color'
    )
    secondary_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#718096',
        help_text='Secondary accent color'
    )
    accent_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#48BB78',
        help_text='Accent/highlight color'
    )
    background_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#F7FAFC',
        help_text='Background color'
    )
    text_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#2D3748',
        help_text='Primary text color'
    )
    text_secondary_color = models.CharField(
        max_length=7,
        validators=[hex_color_validator],
        default='#718096',
        help_text='Secondary text color'
    )

    # Font settings
    font_family = models.CharField(
        max_length=100,
        default='Inter, system-ui, sans-serif',
        help_text='Font family for the theme'
    )
    heading_font_family = models.CharField(
        max_length=100,
        default='Inter, system-ui, sans-serif',
        help_text='Font family for headings'
    )

    # Metadata
    is_default = models.BooleanField(
        default=False,
        help_text='Whether this is the default theme'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_themes'
    )

    class Meta:
        db_table = 'themes'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one default theme
        if self.is_default:
            Theme.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_default(cls):
        """Get the default theme."""
        theme = cls.objects.filter(is_default=True, is_active=True).first()
        if not theme:
            theme = cls.objects.filter(is_active=True).first()
        return theme
