"""
Views for the groups app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DistributionGroup, GroupMember
from .serializers import (
    DistributionGroupSerializer,
    DistributionGroupCreateSerializer,
    DistributionGroupUpdateSerializer,
    DistributionGroupListSerializer,
    GroupMemberSerializer,
    GroupMemberCreateSerializer,
)
from apps.users.permissions import IsSuperUser


class DistributionGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for DistributionGroup model."""

    permission_classes = [IsAuthenticated]
    filterset_fields = ['owner']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        # Super users can see all groups
        if user.is_super():
            return DistributionGroup.objects.all()
        # Regular users can only see their own groups
        return DistributionGroup.objects.filter(owner=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return DistributionGroupListSerializer
        if self.action == 'create':
            return DistributionGroupCreateSerializer
        if self.action in ['update', 'partial_update']:
            return DistributionGroupUpdateSerializer
        return DistributionGroupSerializer

    def perform_destroy(self, instance):
        # Only owner or super user can delete
        if instance.owner != self.request.user and not self.request.user.is_super():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this group.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the group."""
        group = self.get_object()

        # Check ownership
        if group.owner != request.user and not request.user.is_super():
            return Response(
                {'error': "You don't have permission to modify this group."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = GroupMemberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = serializer.validated_data.get('user')

        # Check if member already exists
        if group.members.filter(email__iexact=email).exists():
            return Response(
                {'error': 'This email is already in the group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = group.add_member(email, user)

        # Send invitation email if user doesn't exist
        if not user:
            from apps.surveys.utils import send_invitation_email
            send_invitation_email(email, request.user, group=group)

        return Response(
            GroupMemberSerializer(member).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the group."""
        group = self.get_object()

        # Check ownership
        if group.owner != request.user and not request.user.is_super():
            return Response(
                {'error': "You don't have permission to modify this group."},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_count, _ = group.members.filter(email__iexact=email).delete()

        if deleted_count == 0:
            return Response(
                {'error': 'Member not found in this group.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {'message': f'{email} has been removed from the group.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def add_members_bulk(self, request, pk=None):
        """Add multiple members to the group at once."""
        group = self.get_object()

        # Check ownership
        if group.owner != request.user and not request.user.is_super():
            return Response(
                {'error': "You don't have permission to modify this group."},
                status=status.HTTP_403_FORBIDDEN
            )

        emails = request.data.get('emails', [])
        if not emails:
            return Response(
                {'error': 'At least one email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        added = []
        skipped = []

        for email in emails:
            email = email.lower().strip()
            if group.members.filter(email__iexact=email).exists():
                skipped.append(email)
            else:
                member = group.add_member(email)
                added.append(email)

                # Send invitation email if user doesn't exist
                if not member.user:
                    from apps.surveys.utils import send_invitation_email
                    send_invitation_email(email, request.user, group=group)

        return Response({
            'added': added,
            'skipped': skipped,
            'message': f'Added {len(added)} members, skipped {len(skipped)} duplicates.'
        })
