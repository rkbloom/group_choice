#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run database migrations
python manage.py migrate

# Create default theme if it doesn't exist
python manage.py shell -c "
from apps.themes.models import Theme
if not Theme.objects.filter(is_default=True).exists():
    Theme.objects.create(
        name='Default',
        description='Default organic theme',
        is_default=True,
        primary_color='#4A5568',
        secondary_color='#718096',
        accent_color='#48BB78',
        background_color='#F7FAFC',
        text_color='#2D3748',
    )
    print('Created default theme')
else:
    print('Default theme already exists')
"
