# Group Choice

A collaborative decision-making web application that helps groups make choices together through surveys.

## Features

### Survey Types

1. **Ranked Choice Surveys**
   - Up to 10 options for ranking
   - Drag-and-drop interface for ordering preferences
   - Results calculated using the Borda count method

2. **5 Stones Surveys**
   - Exactly 3 choices
   - Participants distribute 5 "stones" among options
   - Captures preference intensity, not just order

### Core Features

- User authentication with three permission levels (User, Admin, Super)
- Reusable distribution groups for survey sharing
- Customizable themes for survey styling
- Real-time email validation during registration
- Anonymous survey option with one-time use links
- Real-time results viewing with polling
- Deadline setting for surveys
- Mobile-responsive design with organic minimalist aesthetic

## Tech Stack

- **Backend**: Django 5.x, Django REST Framework
- **Frontend**: React 18, Tailwind CSS
- **Database**: MySQL
- **Authentication**: JWT (Simple JWT)
- **Drag & Drop**: dnd-kit

## Project Structure

```
group_choice/
├── backend/
│   ├── apps/
│   │   ├── users/          # User management & auth
│   │   ├── surveys/        # Survey CRUD & responses
│   │   ├── themes/         # Theme management
│   │   └── groups/         # Distribution groups
│   ├── group_choice/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── tailwind.config.js
├── .env.example
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
cd /Users/r.kevinbloomquist/Sites/group_choice
```

### 2. Set Up the Backend

#### Create a Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp ../.env.example .env
```

Edit `.env` with your settings:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=group_choice
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

#### Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE group_choice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Run Migrations

```bash
python manage.py migrate
```

#### Create a Superuser

```bash
python manage.py createsuperuser
```

#### Create Initial Theme (Optional)

```bash
python manage.py shell
```

```python
from apps.themes.models import Theme
Theme.objects.create(
    name='Default',
    description='The default Group Choice theme',
    is_default=True
)
exit()
```

#### Start the Backend Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### 3. Set Up the Frontend

#### Install Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

#### Configure Environment

Create a `.env` file in the frontend directory:

```bash
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

#### Start the Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Running Tests

### Backend Tests

```bash
cd backend
source venv/bin/activate
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## API Endpoints

### Authentication

- `POST /api/token/` - Obtain JWT token pair
- `POST /api/token/refresh/` - Refresh access token

### Users

- `POST /api/users/register/` - Register new user
- `GET /api/users/me/` - Get current user
- `PATCH /api/users/me/` - Update current user
- `POST /api/users/check-email/` - Check email availability
- `POST /api/users/check-username/` - Check username availability
- `GET /api/users/dashboard/` - Get dashboard data

### Surveys

- `GET /api/surveys/` - List surveys
- `POST /api/surveys/` - Create survey
- `GET /api/surveys/{id}/` - Get survey details
- `PATCH /api/surveys/{id}/` - Update survey
- `DELETE /api/surveys/{id}/` - Delete survey
- `POST /api/surveys/{id}/respond/` - Submit response
- `GET /api/surveys/{id}/results/` - Get survey results
- `GET /api/surveys/{id}/responses/` - Get individual responses

### Themes

- `GET /api/themes/` - List themes
- `POST /api/themes/` - Create theme (Admin only)
- `GET /api/themes/default/` - Get default theme

### Groups

- `GET /api/groups/` - List distribution groups
- `POST /api/groups/` - Create group
- `POST /api/groups/{id}/add_member/` - Add member
- `POST /api/groups/{id}/remove_member/` - Remove member

## Permission Levels

| Permission | User | Admin | Super |
|------------|------|-------|-------|
| Create surveys | ✓ | ✓ | ✓ |
| Manage own surveys | ✓ | ✓ | ✓ |
| Manage themes | | ✓ | ✓ |
| Manage users | | ✓ | ✓ |
| Delete any resource | | | ✓ |

## Email Configuration

For Gmail SMTP:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password in `EMAIL_HOST_PASSWORD`

## Troubleshooting

### MySQL Connection Issues

If you encounter `mysqlclient` installation issues:

```bash
# macOS
brew install mysql-client pkg-config
export PKG_CONFIG_PATH="/opt/homebrew/opt/mysql-client/lib/pkgconfig"
pip install mysqlclient
```

### CORS Issues

Ensure `CORS_ALLOWED_ORIGINS` in settings matches your frontend URL.

### JWT Token Expiration

Access tokens expire in 1 hour. The frontend automatically refreshes tokens using the refresh token.

## Development Notes

### Adding a New App

```bash
cd backend
python manage.py startapp new_app apps/new_app
```

Then add `'apps.new_app'` to `INSTALLED_APPS` in settings.

### Database Migrations

After model changes:

```bash
python manage.py makemigrations
python manage.py migrate
```

## License

This project is for personal/educational use.
