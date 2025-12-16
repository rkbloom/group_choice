"""
Admin configuration for the groups app.
"""
from django.contrib import admin
from .models import DistributionGroup, GroupMember


class GroupMemberInline(admin.TabularInline):
    """Inline admin for GroupMember."""

    model = GroupMember
    extra = 1
    readonly_fields = ['added_at']
    autocomplete_fields = ['user']


@admin.register(DistributionGroup)
class DistributionGroupAdmin(admin.ModelAdmin):
    """Admin configuration for DistributionGroup model."""

    list_display = ['name', 'owner', 'member_count', 'created_at']
    list_filter = ['created_at', 'owner']
    search_fields = ['name', 'description', 'owner__username', 'owner__email']
    ordering = ['name']
    autocomplete_fields = ['owner']
    inlines = [GroupMemberInline]

    readonly_fields = ['created_at', 'updated_at']


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    """Admin configuration for GroupMember model."""

    list_display = ['email', 'group', 'user', 'is_registered', 'added_at']
    list_filter = ['added_at', 'group']
    search_fields = ['email', 'user__username', 'group__name']
    ordering = ['-added_at']
    autocomplete_fields = ['group', 'user']

    readonly_fields = ['added_at']
