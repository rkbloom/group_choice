"""
URL configuration for Group Choice project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App APIs
    path('api/users/', include('apps.users.urls')),
    path('api/themes/', include('apps.themes.urls')),
    path('api/groups/', include('apps.groups.urls')),
    path('api/surveys/', include('apps.surveys.urls')),
]
