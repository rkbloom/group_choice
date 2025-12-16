"""
Serializers for the users app.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'permission_level', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password_confirm'
        ]

    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        """Validate username uniqueness."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        """Create a new user."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username']

    def validate_username(self, value):
        """Validate username uniqueness excluding current user."""
        user = self.context.get('request').user
        if User.objects.filter(username__iexact=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admins updating users."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'permission_level', 'is_active']

    def validate_email(self, value):
        """Validate email uniqueness excluding current user."""
        user_id = self.instance.id if self.instance else None
        if User.objects.filter(email__iexact=value).exclude(id=user_id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        """Validate username uniqueness excluding current user."""
        user_id = self.instance.id if self.instance else None
        if User.objects.filter(username__iexact=value).exclude(id=user_id).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Validate old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        """Validate new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': "Passwords do not match."
            })
        return attrs


class EmailCheckSerializer(serializers.Serializer):
    """Serializer for checking email availability."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Check if email is available."""
        return value.lower()
