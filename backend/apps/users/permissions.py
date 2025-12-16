"""
Custom permissions for the users app.
"""
from rest_framework import permissions


class IsAdminOrSuper(permissions.BasePermission):
    """Permission class for admin or super users only."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_admin()
        )


class IsSuperUser(permissions.BasePermission):
    """Permission class for super users only."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_super()
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission class for owner or admin users."""

    def has_object_permission(self, request, view, obj):
        # Admin/Super can access any object
        if request.user.is_admin():
            return True
        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Check if the object is the user themselves
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        return False


class CanManageUsers(permissions.BasePermission):
    """Permission class for managing users."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Only admin and super can list users
        if view.action in ['list', 'retrieve']:
            return request.user.is_admin()

        # Only super can delete users
        if view.action == 'destroy':
            return request.user.is_super()

        # Admin and super can create/update users
        if view.action in ['create', 'update', 'partial_update']:
            return request.user.is_admin()

        return False

    def has_object_permission(self, request, view, obj):
        # Super can do anything
        if request.user.is_super():
            return True

        # Admin can manage users but not super users
        if request.user.is_admin():
            if view.action == 'destroy':
                return False  # Only super can delete
            return obj.permission_level != 'super'

        return False
