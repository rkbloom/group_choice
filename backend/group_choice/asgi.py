"""
ASGI config for Group Choice project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'group_choice.settings')

application = get_asgi_application()
