"""
Tests for the themes app.
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.users.models import User
from .models import Theme


class ThemeModelTests(TestCase):
    """Tests for Theme model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            permission_level=User.PermissionLevel.ADMIN
        )

    def test_create_theme(self):
        """Test creating a theme."""
        theme = Theme.objects.create(
            name='Test Theme',
            primary_color='#FF5733',
            created_by=self.user
        )
        self.assertEqual(theme.name, 'Test Theme')
        self.assertEqual(theme.primary_color, '#FF5733')

    def test_default_theme(self):
        """Test setting default theme."""
        theme1 = Theme.objects.create(
            name='Theme 1',
            is_default=True,
            created_by=self.user
        )
        theme2 = Theme.objects.create(
            name='Theme 2',
            is_default=True,
            created_by=self.user
        )

        # Only theme2 should be default now
        theme1.refresh_from_db()
        self.assertFalse(theme1.is_default)
        self.assertTrue(theme2.is_default)

    def test_get_default_theme(self):
        """Test getting default theme."""
        Theme.objects.create(
            name='Default Theme',
            is_default=True,
            created_by=self.user
        )
        Theme.objects.create(
            name='Other Theme',
            created_by=self.user
        )

        default = Theme.get_default()
        self.assertEqual(default.name, 'Default Theme')


class ThemeAPITests(APITestCase):
    """Tests for theme API endpoints."""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            permission_level=User.PermissionLevel.ADMIN
        )
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )

    def test_list_themes_public(self):
        """Test that themes list is public."""
        Theme.objects.create(
            name='Public Theme',
            created_by=self.admin_user
        )

        url = reverse('theme-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_theme_requires_admin(self):
        """Test that creating themes requires admin permission."""
        url = reverse('theme-list')
        data = {
            'name': 'New Theme',
            'primary_color': '#FF5733'
        }

        # Regular user should be denied
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin should succeed
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_default_theme(self):
        """Test getting default theme endpoint."""
        Theme.objects.create(
            name='Default Theme',
            is_default=True,
            created_by=self.admin_user
        )

        url = reverse('theme-default')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Default Theme')
