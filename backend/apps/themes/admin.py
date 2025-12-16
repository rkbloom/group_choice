"""
Admin configuration for the themes app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Theme


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    """Admin configuration for Theme model."""

    list_display = [
        'name', 'color_preview', 'is_default', 'is_active', 'created_at'
    ]
    list_filter = ['is_default', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

    fieldsets = (
        (None, {
            'fields': ('name', 'description')
        }),
        ('Colors', {
            'fields': (
                'primary_color', 'secondary_color', 'accent_color',
                'background_color', 'text_color', 'text_secondary_color'
            )
        }),
        ('Typography', {
            'fields': ('font_family', 'heading_font_family')
        }),
        ('Settings', {
            'fields': ('is_default', 'is_active', 'created_by')
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    def color_preview(self, obj):
        """Display color swatches for the theme."""
        return format_html(
            '<span style="display:inline-block;width:20px;height:20px;'
            'background-color:{};margin-right:5px;border:1px solid #ccc;"></span>'
            '<span style="display:inline-block;width:20px;height:20px;'
            'background-color:{};margin-right:5px;border:1px solid #ccc;"></span>'
            '<span style="display:inline-block;width:20px;height:20px;'
            'background-color:{};border:1px solid #ccc;"></span>',
            obj.primary_color, obj.secondary_color, obj.accent_color
        )
    color_preview.short_description = 'Colors'
