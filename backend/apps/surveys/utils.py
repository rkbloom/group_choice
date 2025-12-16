"""
Utility functions for the surveys app.
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def create_anonymous_invitations(survey):
    """Create invitations with unique tokens for ALL group members."""
    from .models import AnonymousInvitation

    if not survey.distribution_group:
        return []

    invitations = []
    for member in survey.distribution_group.members.all():
        # Create invitation for ALL members (registered or not)
        # This ensures everyone gets a unique token URL
        invitation, created = AnonymousInvitation.objects.get_or_create(
            survey=survey,
            email=member.email,
            defaults={
                'user': member.user,  # Link to user if registered
                'expires_at': survey.deadline or timezone.now() + timedelta(days=30)
            }
        )
        if created:
            invitations.append(invitation)

    return invitations


def send_survey_notifications(survey, is_new=True):
    """Send email notifications for a survey."""
    if not survey.distribution_group:
        return

    # Send to ALL members using their unique invitation token URLs
    for invitation in survey.anonymous_invitations.filter(is_used=False):
        try:
            # Get recipient name - use first name if registered, otherwise "there"
            if invitation.user:
                recipient_name = invitation.user.first_name
                is_anonymous = False
            else:
                recipient_name = "there"
                is_anonymous = True

            send_survey_email(
                recipient_email=invitation.email,
                recipient_name=recipient_name,
                survey=survey,
                survey_url=invitation.survey_url,  # Unique token URL for each user
                is_new=is_new,
                is_anonymous=is_anonymous
            )
        except Exception as e:
            logger.error(f"Failed to send survey notification to {invitation.email}: {e}")


def send_survey_email(recipient_email, recipient_name, survey, survey_url, is_new=True, is_anonymous=False):
    """Send a survey notification email."""
    action = "invited you to take" if is_new else "updated"

    subject = f"{'New Survey' if is_new else 'Survey Updated'}: {survey.title}"

    # Plain text message
    message = f"""
Hi {recipient_name},

{survey.author.full_name} has {action} a survey: "{survey.title}"

Question: {survey.question}

{survey.description if survey.description else ''}

{'This is a one-time use link for your response.' if is_anonymous else ''}

Take the survey here: {survey_url}

{'Deadline: ' + survey.deadline.strftime('%B %d, %Y at %I:%M %p') if survey.deadline else ''}

Best,
The Group Choice Team
"""

    # HTML message
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #2D3748; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4A5568; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #F7FAFC; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #48BB78; color: white; padding: 12px 24px;
                   text-decoration: none; border-radius: 6px; margin-top: 16px; }}
        .button:hover {{ background-color: #38A169; }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #718096; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">{'New Survey' if is_new else 'Survey Updated'}</h1>
        </div>
        <div class="content">
            <p>Hi {recipient_name},</p>
            <p><strong>{survey.author.full_name}</strong> has {action} a survey:</p>
            <h2 style="color: #4A5568;">{survey.title}</h2>
            <p><strong>Question:</strong> {survey.question}</p>
            {'<p>' + survey.description + '</p>' if survey.description else ''}
            {'<p style="color: #E53E3E;"><em>This is a one-time use link for your response.</em></p>' if is_anonymous else ''}
            <a href="{survey_url}" class="button">Take the Survey</a>
            {'<p style="margin-top: 16px;"><strong>Deadline:</strong> ' + survey.deadline.strftime('%B %d, %Y at %I:%M %p') + '</p>' if survey.deadline else ''}
        </div>
        <div class="footer">
            <p>This email was sent by Group Choice. If you didn't expect this email, you can ignore it.</p>
        </div>
    </div>
</body>
</html>
"""

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        html_message=html_message,
        fail_silently=False
    )


def send_invitation_email(email, inviter, group=None, survey=None):
    """Send an invitation email to create an account."""
    subject = "You've been invited to Group Choice"

    register_url = f"{settings.FRONTEND_URL}/register?email={email}"

    context = ""
    if group:
        context = f"to the distribution group '{group.name}'"
    if survey:
        context = f"to take the survey '{survey.title}'"

    message = f"""
Hi there,

{inviter.full_name} has invited you {context}.

Group Choice is a collaborative decision-making tool that helps groups make choices together.

To get started, create your account here: {register_url}

Best,
The Group Choice Team
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #2D3748; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4A5568; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #F7FAFC; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background-color: #48BB78; color: white; padding: 12px 24px;
                   text-decoration: none; border-radius: 6px; margin-top: 16px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">You're Invited!</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p><strong>{inviter.full_name}</strong> has invited you {context}.</p>
            <p>Group Choice is a collaborative decision-making tool that helps groups make choices together.</p>
            <a href="{register_url}" class="button">Create Your Account</a>
        </div>
    </div>
</body>
</html>
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False
        )
    except Exception as e:
        logger.error(f"Failed to send invitation email to {email}: {e}")
