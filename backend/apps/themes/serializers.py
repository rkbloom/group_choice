"""
Serializers for the themes app.
"""
from rest_framework import serializers
from .models import Theme


class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for Theme model."""

    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Theme
        fields = [
            'id', 'name', 'description',
            'primary_color', 'secondary_color', 'accent_color',
            'background_color', 'text_color', 'text_secondary_color',
            'font_family', 'heading_font_family',
            'is_default', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name
        return None


class ThemeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating themes."""

    class Meta:
        model = Theme
        fields = [
            'name', 'description',
            'primary_color', 'secondary_color', 'accent_color',
            'background_color', 'text_color', 'text_secondary_color',
            'font_family', 'heading_font_family',
            'is_default', 'is_active'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ThemeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for theme listings."""

    class Meta:
        model = Theme
        fields = [
            'id', 'name', 'primary_color', 'secondary_color',
            'accent_color', 'is_default', 'is_active'
        ]
