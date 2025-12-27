"""
Tests for the surveys app.
"""
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.users.models import User
from apps.themes.models import Theme
from apps.groups.models import DistributionGroup
from .models import Survey, SurveyChoice, SurveyResponse, RankedChoiceAnswer, FiveStonesAnswer


class SurveyModelTests(TestCase):
    """Tests for Survey models."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_create_ranked_choice_survey(self):
        """Test creating a ranked choice survey."""
        survey = Survey.objects.create(
            title='Test Survey',
            question='What do you prefer?',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )
        self.assertEqual(survey.survey_type, 'ranked_choice')
        self.assertEqual(survey.author, self.user)
        self.assertTrue(survey.is_active)

    def test_create_five_stones_survey(self):
        """Test creating a 5 stones survey."""
        survey = Survey.objects.create(
            title='5 Stones Survey',
            question='Allocate your stones',
            survey_type=Survey.SurveyType.FIVE_STONES,
            author=self.user
        )
        self.assertEqual(survey.survey_type, 'five_stones')

    def test_borda_count_calculation(self):
        """Test Borda count calculation for ranked choice survey."""
        survey = Survey.objects.create(
            title='Ranked Survey',
            question='Rank these options',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )

        # Create 3 choices
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)
        choice3 = SurveyChoice.objects.create(survey=survey, text='Option C', order=3)

        # Create a response with rankings
        response = SurveyResponse.objects.create(survey=survey, user=self.user)
        RankedChoiceAnswer.objects.create(response=response, choice=choice1, rank=1)
        RankedChoiceAnswer.objects.create(response=response, choice=choice2, rank=2)
        RankedChoiceAnswer.objects.create(response=response, choice=choice3, rank=3)

        # Calculate results
        results = survey.get_results()

        self.assertEqual(results['type'], 'ranked_choice')
        self.assertEqual(results['method'], 'borda_count')
        self.assertEqual(results['total_responses'], 1)

        # With 3 choices: 1st place = 3 points, 2nd = 2, 3rd = 1
        # Option A should have highest score (3)
        self.assertEqual(results['results'][0]['score'], 3)
        self.assertEqual(results['results'][0]['text'], 'Option A')

    def test_five_stones_calculation(self):
        """Test 5 stones result calculation."""
        survey = Survey.objects.create(
            title='Stones Survey',
            question='Allocate stones',
            survey_type=Survey.SurveyType.FIVE_STONES,
            author=self.user
        )

        # Create 3 choices
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)
        choice3 = SurveyChoice.objects.create(survey=survey, text='Option C', order=3)

        # Create a response with stone allocations
        response = SurveyResponse.objects.create(survey=survey, user=self.user)
        FiveStonesAnswer.objects.create(response=response, choice=choice1, stones=3)
        FiveStonesAnswer.objects.create(response=response, choice=choice2, stones=2)
        FiveStonesAnswer.objects.create(response=response, choice=choice3, stones=0)

        # Calculate results
        results = survey.get_results()

        self.assertEqual(results['type'], 'five_stones')
        self.assertEqual(results['total_responses'], 1)
        self.assertEqual(results['total_stones'], 5)

        # Option A should have highest stones (3)
        self.assertEqual(results['results'][0]['stones'], 3)


class SurveyAPITests(APITestCase):
    """Tests for survey API endpoints."""

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

    def test_create_survey(self):
        """Test creating a survey via API."""
        self.client.force_authenticate(user=self.user)
        url = reverse('survey-list')
        data = {
            'title': 'New Survey',
            'question': 'What do you prefer?',
            'survey_type': 'ranked_choice',
            'choices': ['Option 1', 'Option 2', 'Option 3']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Survey.objects.filter(title='New Survey').exists())

    def test_create_five_stones_survey_requires_3_choices(self):
        """Test that 5 stones surveys require exactly 3 choices."""
        self.client.force_authenticate(user=self.user)
        url = reverse('survey-list')

        # Try with 2 choices - should fail
        data = {
            'title': 'Stones Survey',
            'question': 'Allocate stones',
            'survey_type': 'five_stones',
            'choices': ['Option 1', 'Option 2']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Try with exactly 3 choices - should succeed
        data['choices'] = ['Option 1', 'Option 2', 'Option 3']
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_own_surveys(self):
        """Test listing surveys as author."""
        self.client.force_authenticate(user=self.user)

        # Create a survey
        Survey.objects.create(
            title='My Survey',
            question='Test question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )

        url = reverse('survey-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_submit_ranked_choice_response(self):
        """Test submitting a ranked choice response."""
        # Create survey with choices
        survey = Survey.objects.create(
            title='Ranked Survey',
            question='Rank options',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)

        # Submit response as another user
        self.client.force_authenticate(user=self.other_user)
        url = reverse('survey-respond', args=[survey.id])
        data = {
            'ranked_answers': [
                {'choice_id': str(choice1.id), 'rank': 1},
                {'choice_id': str(choice2.id), 'rank': 2}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(survey.responses.count(), 1)

    def test_prevent_duplicate_response(self):
        """Test that users can only respond once."""
        survey = Survey.objects.create(
            title='Survey',
            question='Question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)

        self.client.force_authenticate(user=self.other_user)
        url = reverse('survey-respond', args=[survey.id])
        data = {
            'ranked_answers': [
                {'choice_id': str(choice1.id), 'rank': 1},
                {'choice_id': str(choice2.id), 'rank': 2}
            ]
        }

        # First response should succeed
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Second response should fail
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_survey_results(self):
        """Test getting survey results."""
        survey = Survey.objects.create(
            title='Survey',
            question='Question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('survey-results', args=[survey.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_toggle_results_visibility(self):
        """Test toggling results visibility."""
        survey = Survey.objects.create(
            title='Survey',
            question='Question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user,
            results_public=False
        )

        self.client.force_authenticate(user=self.user)
        url = reverse('survey-toggle-results-visibility', args=[survey.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['results_public'])

        # Toggle again
        response = self.client.post(url)
        self.assertFalse(response.data['results_public'])

    def test_submit_five_stones_response(self):
        """Test submitting a 5 stones response."""
        # Create 5 stones survey with 3 choices
        survey = Survey.objects.create(
            title='Stones Survey',
            question='Allocate your stones',
            survey_type=Survey.SurveyType.FIVE_STONES,
            author=self.user
        )
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)
        choice3 = SurveyChoice.objects.create(survey=survey, text='Option C', order=3)

        # Submit response as another user
        self.client.force_authenticate(user=self.other_user)
        url = reverse('survey-respond', args=[survey.id])
        data = {
            'stones_answers': [
                {'choice_id': str(choice1.id), 'stones': 3},
                {'choice_id': str(choice2.id), 'stones': 1},
                {'choice_id': str(choice3.id), 'stones': 1}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(survey.responses.count(), 1)

    def test_submit_ranked_choice_with_null_token(self):
        """Test submitting ranked choice with token=None (dashboard submission)."""
        survey = Survey.objects.create(
            title='Survey',
            question='Question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)

        self.client.force_authenticate(user=self.other_user)
        url = reverse('survey-respond', args=[survey.id])
        data = {
            'token': None,  # Explicitly null token (like frontend sends)
            'ranked_answers': [
                {'choice_id': str(choice1.id), 'rank': 1},
                {'choice_id': str(choice2.id), 'rank': 2}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_submit_five_stones_with_null_token(self):
        """Test submitting 5 stones with token=None (dashboard submission)."""
        survey = Survey.objects.create(
            title='Stones Survey',
            question='Allocate stones',
            survey_type=Survey.SurveyType.FIVE_STONES,
            author=self.user
        )
        choice1 = SurveyChoice.objects.create(survey=survey, text='Option A', order=1)
        choice2 = SurveyChoice.objects.create(survey=survey, text='Option B', order=2)
        choice3 = SurveyChoice.objects.create(survey=survey, text='Option C', order=3)

        self.client.force_authenticate(user=self.other_user)
        url = reverse('survey-respond', args=[survey.id])
        data = {
            'token': None,  # Explicitly null token (like frontend sends)
            'stones_answers': [
                {'choice_id': str(choice1.id), 'stones': 2},
                {'choice_id': str(choice2.id), 'stones': 2},
                {'choice_id': str(choice3.id), 'stones': 1}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class AnonymousInvitationTests(APITestCase):
    """Tests for anonymous invitation token submissions."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='author@example.com',
            username='author',
            password='testpass123',
            first_name='Author',
            last_name='User'
        )
        from .models import AnonymousInvitation

        # Create survey
        self.survey = Survey.objects.create(
            title='Survey with Invitations',
            question='Test question',
            survey_type=Survey.SurveyType.RANKED_CHOICE,
            author=self.user
        )
        self.choice1 = SurveyChoice.objects.create(
            survey=self.survey, text='Option A', order=1
        )
        self.choice2 = SurveyChoice.objects.create(
            survey=self.survey, text='Option B', order=2
        )

        # Create invitation
        self.invitation = AnonymousInvitation.objects.create(
            survey=self.survey,
            email='invited@example.com'
        )

    def test_submit_with_valid_token(self):
        """Test submitting a response with a valid invitation token."""
        url = reverse('survey-respond', args=[self.survey.id])
        data = {
            'token': str(self.invitation.token),
            'ranked_answers': [
                {'choice_id': str(self.choice1.id), 'rank': 1},
                {'choice_id': str(self.choice2.id), 'rank': 2}
            ]
        }
        # No authentication - using token
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify invitation is marked as used
        self.invitation.refresh_from_db()
        self.assertTrue(self.invitation.is_used)

    def test_submit_with_used_token_fails(self):
        """Test that a used token cannot be reused."""
        # Mark invitation as used
        self.invitation.mark_used()

        url = reverse('survey-respond', args=[self.survey.id])
        data = {
            'token': str(self.invitation.token),
            'ranked_answers': [
                {'choice_id': str(self.choice1.id), 'rank': 1},
                {'choice_id': str(self.choice2.id), 'rank': 2}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_with_invalid_token_fails(self):
        """Test that an invalid token is rejected."""
        url = reverse('survey-respond', args=[self.survey.id])
        data = {
            'token': 'invalid-token-12345',
            'ranked_answers': [
                {'choice_id': str(self.choice1.id), 'rank': 1},
                {'choice_id': str(self.choice2.id), 'rank': 2}
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
