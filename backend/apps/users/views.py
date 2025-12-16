"""
Views for the users app.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    AdminUserUpdateSerializer,
    PasswordChangeSerializer,
    EmailCheckSerializer,
)
from .permissions import CanManageUsers, IsAdminOrSuper

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model - Admin/Super access only."""

    queryset = User.objects.all()
    permission_classes = [CanManageUsers]
    filterset_fields = ['permission_level', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username', 'email']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer


class RegisterView(generics.CreateAPIView):
    """View for user registration."""

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """View for current user profile."""

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class PasswordChangeView(generics.UpdateAPIView):
    """View for changing password."""

    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )


class CheckEmailView(APIView):
    """View for checking email availability in real-time."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        exists = User.objects.filter(email__iexact=email).exists()

        return Response({
            'email': email,
            'available': not exists
        })


class CheckUsernameView(APIView):
    """View for checking username availability in real-time."""

    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        if not username:
            return Response(
                {'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        exists = User.objects.filter(username__iexact=username).exists()

        return Response({
            'username': username,
            'available': not exists
        })


class DashboardView(APIView):
    """View for user dashboard data."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get surveys authored by user
        authored_surveys = user.authored_surveys.all().order_by('-created_at')[:10]

        # Get surveys user has been invited to
        from apps.surveys.models import Survey, SurveyResponse
        from apps.surveys.serializers import SurveyListSerializer

        # Get groups user is a member of
        member_groups = user.distribution_group_memberships.all()
        invited_survey_ids = []
        for membership in member_groups:
            invited_survey_ids.extend(
                membership.group.surveys.values_list('id', flat=True)
            )

        # Also check anonymous invitations
        anonymous_invites = user.anonymous_invitations.filter(
            is_used=False
        ).values_list('survey_id', flat=True)
        invited_survey_ids.extend(anonymous_invites)

        invited_surveys = Survey.objects.filter(
            id__in=set(invited_survey_ids)
        ).exclude(author=user).order_by('-created_at')[:10]

        # Get response counts
        responses_submitted = SurveyResponse.objects.filter(user=user).count()

        return Response({
            'user': UserSerializer(user).data,
            'authored_surveys': SurveyListSerializer(authored_surveys, many=True).data,
            'invited_surveys': SurveyListSerializer(invited_surveys, many=True).data,
            'stats': {
                'authored_count': user.authored_surveys.count(),
                'invited_count': len(set(invited_survey_ids)),
                'responses_submitted': responses_submitted,
            }
        })
