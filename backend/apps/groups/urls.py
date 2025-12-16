"""
URL configuration for the groups app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DistributionGroupViewSet

router = DefaultRouter()
router.register('', DistributionGroupViewSet, basename='distribution-group')

urlpatterns = [
    path('', include(router.urls)),
]
