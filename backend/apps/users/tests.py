"""
Tests for the users app.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User


class UserModelTests(TestCase):
    """Tests for the User model."""

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.permission_level, User.PermissionLevel.USER)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password('testpass123'))

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.assertEqual(user.permission_level, User.PermissionLevel.SUPER)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_full_name(self):
        """Test the full_name property."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.full_name, 'Test User')

    def test_user_permissions(self):
        """Test permission level methods."""
        regular_user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='pass123',
            first_name='Regular',
            last_name='User'
        )
        admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='pass123',
            first_name='Admin',
            last_name='User',
            permission_level=User.PermissionLevel.ADMIN
        )
        super_user = User.objects.create_user(
            email='super@example.com',
            username='super',
            password='pass123',
            first_name='Super',
            last_name='User',
            permission_level=User.PermissionLevel.SUPER
        )

        self.assertFalse(regular_user.is_admin())
        self.assertFalse(regular_user.is_super())

        self.assertTrue(admin_user.is_admin())
        self.assertFalse(admin_user.is_super())

        self.assertTrue(super_user.is_admin())
        self.assertTrue(super_user.is_super())


class UserAPITests(APITestCase):
    """Tests for user API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_register_user(self):
        """Test user registration."""
        url = reverse('register')
        data = {
            'email': 'new@example.com',
            'username': 'newuser',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='new@example.com').exists())

    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails."""
        url = reverse('register')
        data = {
            'email': 'test@example.com',  # Already exists
            'username': 'anotheruser',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'Another',
            'last_name': 'User'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_email_available(self):
        """Test checking email availability."""
        url = reverse('check-email')

        # Check available email
        response = self.client.post(url, {'email': 'available@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['available'])

        # Check taken email
        response = self.client.post(url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_login(self):
        """Test user login."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_get_current_user(self):
        """Test getting current user profile."""
        self.client.force_authenticate(user=self.user)
        url = reverse('current-user')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_update_profile(self):
        """Test updating user profile."""
        self.client.force_authenticate(user=self.user)
        url = reverse('current-user')
        data = {'first_name': 'Updated'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
