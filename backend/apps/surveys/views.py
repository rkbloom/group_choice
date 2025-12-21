"""
Views for the surveys app.
"""
import logging
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q

logger = logging.getLogger(__name__)

from .models import (
    Survey, SurveyChoice, SurveyResponse,
    AnonymousInvitation
)
from .serializers import (
    SurveySerializer,
    SurveyCreateSerializer,
    SurveyUpdateSerializer,
    SurveyListSerializer,
    SurveyResponseCreateSerializer,
    SurveyResponseSerializer,
    SurveyResultsSerializer,
    AnonymousInvitationSerializer,
)
from apps.users.permissions import IsSuperUser


class SurveyViewSet(viewsets.ModelViewSet):
    """ViewSet for Survey model."""

    permission_classes = [IsAuthenticated]
    filterset_fields = ['survey_type', 'is_active', 'is_anonymous', 'author']
    search_fields = ['title', 'question', 'description']
    ordering_fields = ['created_at', 'updated_at', 'deadline', 'title']

    def get_queryset(self):
        user = self.request.user

        # Super users can see all surveys
        if user.is_super():
            return Survey.objects.all()

        # Regular users see surveys they authored or are invited to
        authored = Q(author=user)

        # Surveys from groups they're members of
        member_groups = user.distribution_group_memberships.values_list(
            'group_id', flat=True
        )
        group_surveys = Q(distribution_group_id__in=member_groups)

        # Surveys they have anonymous invitations for
        invited_surveys = Q(
            id__in=user.anonymous_invitations.values_list('survey_id', flat=True)
        )

        return Survey.objects.filter(authored | group_surveys | invited_surveys).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return SurveyListSerializer
        if self.action == 'create':
            return SurveyCreateSerializer
        if self.action in ['update', 'partial_update']:
            return SurveyUpdateSerializer
        return SurveySerializer

    def get_permissions(self):
        if self.action in ['retrieve', 'respond', 'public_results']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_destroy(self, instance):
        # Only author or super user can delete
        if instance.author != self.request.user and not self.request.user.is_super():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this survey.")
        instance.delete()

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get survey results (author only unless results_public)."""
        survey = self.get_object()

        # Check permissions
        if not survey.results_public:
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Results are not public for this survey.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if survey.author != request.user and not request.user.is_super():
                return Response(
                    {'error': 'You do not have permission to view these results.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        results = survey.get_results()
        return Response(results)

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        """Get individual responses (author only, non-anonymous surveys)."""
        survey = self.get_object()

        # Check permissions
        if survey.author != request.user and not request.user.is_super():
            return Response(
                {'error': 'You do not have permission to view responses.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if survey.is_anonymous:
            return Response(
                {'error': 'Individual responses are not available for anonymous surveys.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        responses = survey.responses.all()
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Submit a response to the survey."""
        survey = self.get_object()

        serializer = SurveyResponseCreateSerializer(
            data=request.data,
            context={'request': request, 'survey': survey}
        )

        if not serializer.is_valid():
            logger.warning(
                f"Survey response validation failed for survey {pk}: {serializer.errors}. "
                f"Request data: {request.data}, User: {request.user}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        response = serializer.save()

        return Response(
            {'message': 'Response submitted successfully.', 'response_id': str(response.id)},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def toggle_results_visibility(self, request, pk=None):
        """Toggle whether results are public."""
        survey = self.get_object()

        # Check ownership
        if survey.author != request.user and not request.user.is_super():
            return Response(
                {'error': 'You do not have permission to modify this survey.'},
                status=status.HTTP_403_FORBIDDEN
            )

        survey.results_public = not survey.results_public
        survey.save()

        return Response({
            'results_public': survey.results_public,
            'message': f"Results are now {'public' if survey.results_public else 'hidden'}."
        })

    @action(detail=True, methods=['get'])
    def check_response_status(self, request, pk=None):
        """Check if user has already responded."""
        survey = self.get_object()
        token = request.query_params.get('token')

        if token:
            invitation = AnonymousInvitation.objects.filter(
                survey=survey,
                token=token
            ).first()
            if invitation:
                return Response({
                    'can_respond': invitation.is_valid,
                    'has_responded': invitation.is_used
                })
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.is_authenticated:
            has_responded = survey.responses.filter(user=request.user).exists()
            return Response({
                'can_respond': not has_responded and survey.is_active and not survey.is_expired,
                'has_responded': has_responded
            })

        return Response({
            'can_respond': False,
            'has_responded': False,
            'error': 'Authentication required'
        })


class PublicSurveyView(generics.RetrieveAPIView):
    """Public view for taking a survey."""

    permission_classes = [AllowAny]
    serializer_class = SurveySerializer
    queryset = Survey.objects.filter(is_active=True)
    lookup_field = 'pk'

    def retrieve(self, request, *args, **kwargs):
        survey = self.get_object()
        token = request.query_params.get('token')

        # Check if survey can be accessed
        if survey.is_expired:
            return Response(
                {'error': 'This survey has expired.'},
                status=status.HTTP_410_GONE
            )

        if not survey.is_active:
            return Response(
                {'error': 'This survey is no longer active.'},
                status=status.HTTP_410_GONE
            )

        # Validate token for anonymous access
        can_respond = False
        has_responded = False

        if token:
            invitation = AnonymousInvitation.objects.filter(
                survey=survey,
                token=token
            ).first()
            if invitation:
                can_respond = invitation.is_valid
                has_responded = invitation.is_used
        elif request.user.is_authenticated:
            has_responded = survey.responses.filter(user=request.user).exists()
            can_respond = not has_responded

        serializer = self.get_serializer(survey)
        data = serializer.data
        data['can_respond'] = can_respond
        data['has_responded'] = has_responded

        return Response(data)


class MySurveysView(APIView):
    """View for getting user's authored and invited surveys."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        filter_type = request.query_params.get('type', 'all')  # all, authored, invited
        search = request.query_params.get('search', '')

        # Get authored surveys
        authored = Survey.objects.filter(author=user)

        # Get invited surveys
        member_groups = user.distribution_group_memberships.values_list(
            'group_id', flat=True
        )
        invited = Survey.objects.filter(
            distribution_group_id__in=member_groups
        ).exclude(author=user)

        # Apply search filter
        if search:
            authored = authored.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
            invited = invited.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Filter by type
        if filter_type == 'authored':
            surveys = authored
        elif filter_type == 'invited':
            surveys = invited
        else:
            surveys = None

        response_data = {}

        if filter_type in ['all', 'authored']:
            response_data['authored'] = SurveyListSerializer(
                authored.order_by('-created_at'), many=True
            ).data

        if filter_type in ['all', 'invited']:
            response_data['invited'] = SurveyListSerializer(
                invited.order_by('-created_at'), many=True
            ).data

        return Response(response_data)
