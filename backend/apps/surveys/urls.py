"""
URL configuration for the surveys app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SurveyViewSet,
    PublicSurveyView,
    MySurveysView,
)

router = DefaultRouter()
router.register('', SurveyViewSet, basename='survey')

urlpatterns = [
    path('my-surveys/', MySurveysView.as_view(), name='my-surveys'),
    path('public/<uuid:pk>/', PublicSurveyView.as_view(), name='public-survey'),
    path('', include(router.urls)),
]
