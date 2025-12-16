"""
Tests for the groups app.
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.users.models import User
from .models import DistributionGroup, GroupMember


class DistributionGroupModelTests(TestCase):
    """Tests for DistributionGroup models."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_create_group(self):
        """Test creating a distribution group."""
        group = DistributionGroup.objects.create(
            name='Test Group',
            description='A test group',
            owner=self.user
        )
        self.assertEqual(group.name, 'Test Group')
        self.assertEqual(group.owner, self.user)
        self.assertEqual(group.member_count, 0)

    def test_add_member_by_email(self):
        """Test adding a member by email."""
        group = DistributionGroup.objects.create(
            name='Test Group',
            owner=self.user
        )
        member = group.add_member('member@example.com')
        self.assertEqual(member.email, 'member@example.com')
        self.assertEqual(group.member_count, 1)

    def test_add_member_links_existing_user(self):
        """Test that adding a member by email links to existing user."""
        existing_user = User.objects.create_user(
            email='existing@example.com',
            username='existing',
            password='pass123',
            first_name='Existing',
            last_name='User'
        )
        group = DistributionGroup.objects.create(
            name='Test Group',
            owner=self.user
        )
        member = group.add_member('existing@example.com')
        self.assertEqual(member.user, existing_user)

    def test_remove_member(self):
        """Test removing a member."""
        group = DistributionGroup.objects.create(
            name='Test Group',
            owner=self.user
        )
        group.add_member('member@example.com')
        self.assertEqual(group.member_count, 1)

        group.remove_member('member@example.com')
        self.assertEqual(group.member_count, 0)


class DistributionGroupAPITests(APITestCase):
    """Tests for distribution group API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )

    def test_create_group(self):
        """Test creating a group via API."""
        self.client.force_authenticate(user=self.user)
        url = reverse('distribution-group-list')
        data = {
            'name': 'My Group',
            'description': 'A new group'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DistributionGroup.objects.filter(name='My Group').exists())

    def test_list_own_groups(self):
        """Test listing only own groups."""
        self.client.force_authenticate(user=self.user)

        # Create groups for both users
        DistributionGroup.objects.create(name='My Group', owner=self.user)
        DistributionGroup.objects.create(name='Other Group', owner=self.other_user)

        url = reverse('distribution-group-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'My Group')

    def test_add_member_to_group(self):
        """Test adding a member to a group."""
        self.client.force_authenticate(user=self.user)

        group = DistributionGroup.objects.create(name='My Group', owner=self.user)

        url = reverse('distribution-group-add-member', args=[group.id])
        data = {'email': 'newmember@example.com'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(group.member_count, 1)

    def test_cannot_modify_other_users_group(self):
        """Test that users cannot modify others' groups."""
        self.client.force_authenticate(user=self.user)

        # Create group owned by other user
        group = DistributionGroup.objects.create(name='Other Group', owner=self.other_user)

        url = reverse('distribution-group-add-member', args=[group.id])
        data = {'email': 'member@example.com'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
