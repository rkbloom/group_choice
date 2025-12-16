"""
Admin configuration for the surveys app.
"""
from django.contrib import admin
from .models import (
    Survey, SurveyChoice, SurveyResponse,
    RankedChoiceAnswer, FiveStonesAnswer, AnonymousInvitation
)


class SurveyChoiceInline(admin.TabularInline):
    """Inline admin for SurveyChoice."""

    model = SurveyChoice
    extra = 3
    ordering = ['order']


class SurveyResponseInline(admin.TabularInline):
    """Inline admin for SurveyResponse."""

    model = SurveyResponse
    extra = 0
    readonly_fields = ['user', 'anonymous_email', 'submitted_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    """Admin configuration for Survey model."""

    list_display = [
        'title', 'survey_type', 'author', 'response_count',
        'is_active', 'is_anonymous', 'deadline', 'created_at'
    ]
    list_filter = ['survey_type', 'is_active', 'is_anonymous', 'created_at']
    search_fields = ['title', 'question', 'description', 'author__username']
    ordering = ['-created_at']
    autocomplete_fields = ['author', 'distribution_group', 'theme']
    inlines = [SurveyChoiceInline, SurveyResponseInline]

    fieldsets = (
        (None, {
            'fields': ('title', 'question', 'description', 'survey_type')
        }),
        ('Author & Distribution', {
            'fields': ('author', 'distribution_group', 'theme')
        }),
        ('Settings', {
            'fields': ('is_anonymous', 'results_public', 'deadline', 'is_active')
        }),
    )

    readonly_fields = ['created_at', 'updated_at']


@admin.register(SurveyChoice)
class SurveyChoiceAdmin(admin.ModelAdmin):
    """Admin configuration for SurveyChoice model."""

    list_display = ['text', 'survey', 'order']
    list_filter = ['survey__survey_type']
    search_fields = ['text', 'survey__title']
    ordering = ['survey', 'order']


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    """Admin configuration for SurveyResponse model."""

    list_display = ['survey', 'user', 'anonymous_email', 'submitted_at']
    list_filter = ['submitted_at', 'survey__survey_type']
    search_fields = ['survey__title', 'user__username', 'anonymous_email']
    ordering = ['-submitted_at']
    autocomplete_fields = ['survey', 'user']

    readonly_fields = ['submitted_at', 'ip_address']


@admin.register(RankedChoiceAnswer)
class RankedChoiceAnswerAdmin(admin.ModelAdmin):
    """Admin configuration for RankedChoiceAnswer model."""

    list_display = ['response', 'choice', 'rank']
    list_filter = ['rank']
    search_fields = ['response__survey__title', 'choice__text']
    ordering = ['response', 'rank']


@admin.register(FiveStonesAnswer)
class FiveStonesAnswerAdmin(admin.ModelAdmin):
    """Admin configuration for FiveStonesAnswer model."""

    list_display = ['response', 'choice', 'stones']
    list_filter = ['stones']
    search_fields = ['response__survey__title', 'choice__text']
    ordering = ['response', '-stones']


@admin.register(AnonymousInvitation)
class AnonymousInvitationAdmin(admin.ModelAdmin):
    """Admin configuration for AnonymousInvitation model."""

    list_display = ['email', 'survey', 'is_used', 'created_at', 'expires_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['email', 'survey__title']
    ordering = ['-created_at']
    autocomplete_fields = ['survey', 'user']

    readonly_fields = ['token', 'created_at', 'used_at']
