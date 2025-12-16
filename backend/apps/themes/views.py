"""
Views for the themes app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Theme
from .serializers import (
    ThemeSerializer,
    ThemeCreateSerializer,
    ThemeListSerializer,
)
from apps.users.permissions import IsAdminOrSuper, IsSuperUser


class ThemeViewSet(viewsets.ModelViewSet):
    """ViewSet for Theme model."""

    queryset = Theme.objects.filter(is_active=True)
    filterset_fields = ['is_default', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'default']:
            return [AllowAny()]
        if self.action == 'destroy':
            return [IsSuperUser()]
        return [IsAdminOrSuper()]

    def get_serializer_class(self):
        if self.action == 'list':
            return ThemeListSerializer
        if self.action == 'create':
            return ThemeCreateSerializer
        return ThemeSerializer

    def get_queryset(self):
        queryset = Theme.objects.all()
        # Non-admin users only see active themes
        if not self.request.user.is_authenticated or not self.request.user.is_admin():
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the default theme."""
        theme = Theme.get_default()
        if theme:
            return Response(ThemeSerializer(theme).data)
        return Response(
            {'error': 'No default theme found'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a theme as the default."""
        theme = self.get_object()
        theme.is_default = True
        theme.save()
        return Response(ThemeSerializer(theme).data)
