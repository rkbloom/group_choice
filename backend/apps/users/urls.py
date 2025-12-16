"""
URL configuration for the users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    RegisterView,
    CurrentUserView,
    PasswordChangeView,
    CheckEmailView,
    CheckUsernameView,
    DashboardView,
)

router = DefaultRouter()
router.register('', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me/password/', PasswordChangeView.as_view(), name='password-change'),
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]
