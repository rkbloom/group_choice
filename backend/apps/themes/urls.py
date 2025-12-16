"""
URL configuration for the themes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThemeViewSet

router = DefaultRouter()
router.register('', ThemeViewSet, basename='theme')

urlpatterns = [
    path('', include(router.urls)),
]
