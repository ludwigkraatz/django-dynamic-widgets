from dynamic_widgets.editor import models
from introspective_api import serializers
from rest_framework import fields

from rest_framework import fields
    

class DjangoTemplateVersionSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    
    class Header(serializers.HeaderClass):
        preview         =   serializers.HyperlinkedRelatedView(view_namespace='api:staff', view_name="djangotemplateversion-preview", slug_field="pk", slug_url_kwarg="uuid")
        #url             =   serializers.HyperlinkedIdentityField(view_namespace='api:staff', view_name="djangotemplateversion-details", slug_field="pk", slug_url_kwarg="uuid")  
    
    class Meta:
        model       =   models.DjangoTemplateVersion
