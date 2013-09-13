import json as simplejson

from django.utils.functional import SimpleLazyObject
from django import template
from django import shortcuts

from introspective_api import generics
from introspective_api.response import ApiResponse

from dynamic_widgets.editor.api import serializers
from dynamic_widgets import get_django_template_model, get_content_model
from dynamic_widgets.settings import dynamic_widgets_settings

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

class TemplateList(generics.ListCreateAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_django_template_model()
    serializer_class = serializers.DjangoTemplateSerializer
        
    lookup_field  =   "id"

class TemplateDetail(generics.RetrieveUpdateAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_django_template_model()
    serializer_class = serializers.DjangoTemplateSerializer
    export_context = False
    
    
class ContentList(generics.ListCreateAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_content_model()
    serializer_class = serializers.ContentSerializer
        
    lookup_field  =   "id"

class ContentDetail(generics.RetrieveUpdateAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_content_model()
    serializer_class = serializers.ContentSerializer
    export_context = False
    
    