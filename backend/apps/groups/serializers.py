"""
Serializers for the groups app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DistributionGroup, GroupMember

User = get_user_model()


class GroupMemberSerializer(serializers.ModelSerializer):
    """Serializer for GroupMember model."""

    user_name = serializers.SerializerMethodField()
    is_registered = serializers.ReadOnlyField()

    class Meta:
        model = GroupMember
        fields = ['id', 'email', 'user', 'user_name', 'is_registered', 'added_at']
        read_only_fields = ['id', 'user', 'added_at']

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.full_name
        return None


class GroupMemberCreateSerializer(serializers.Serializer):
    """Serializer for adding members to a group."""

    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')

        if not email and not username:
            raise serializers.ValidationError(
                "Either email or username is required."
            )

        # If username provided, try to get user's email
        if username:
            try:
                user = User.objects.get(username__iexact=username)
                attrs['email'] = user.email
                attrs['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'username': f"No user found with username '{username}'."
                })
        else:
            # Try to find user by email
            try:
                user = User.objects.get(email__iexact=email)
                attrs['user'] = user
            except User.DoesNotExist:
                attrs['user'] = None

        return attrs


class DistributionGroupSerializer(serializers.ModelSerializer):
    """Serializer for DistributionGroup model."""

    members = GroupMemberSerializer(many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = DistributionGroup
        fields = [
            'id', 'name', 'description', 'owner', 'owner_name',
            'members', 'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        return obj.owner.full_name


class DistributionGroupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating distribution groups."""

    member_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = DistributionGroup
        fields = ['name', 'description', 'member_emails']

    def validate_name(self, value):
        """Validate name uniqueness for this owner."""
        owner = self.context['request'].user
        if DistributionGroup.objects.filter(
            name__iexact=value, owner=owner
        ).exists():
            raise serializers.ValidationError(
                "You already have a group with this name."
            )
        return value

    def create(self, validated_data):
        member_emails = validated_data.pop('member_emails', [])
        validated_data['owner'] = self.context['request'].user

        group = DistributionGroup.objects.create(**validated_data)

        # Add members
        for email in member_emails:
            group.add_member(email)

        return group


class DistributionGroupUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating distribution groups."""

    class Meta:
        model = DistributionGroup
        fields = ['name', 'description']

    def validate_name(self, value):
        """Validate name uniqueness for this owner."""
        owner = self.context['request'].user
        instance = self.instance
        if DistributionGroup.objects.filter(
            name__iexact=value, owner=owner
        ).exclude(id=instance.id).exists():
            raise serializers.ValidationError(
                "You already have a group with this name."
            )
        return value


class DistributionGroupListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for group listings."""

    member_count = serializers.ReadOnlyField()

    class Meta:
        model = DistributionGroup
        fields = ['id', 'name', 'description', 'member_count', 'created_at']
