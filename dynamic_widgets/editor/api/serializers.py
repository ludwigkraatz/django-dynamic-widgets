from introspective_api import serializers
from dynamic_widgets import get_django_template_model, get_content_model

        
class DjangoTemplateSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    
    class Meta:
        model       =   get_django_template_model()

class ContentSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    
    class Meta:
        model       =   get_content_model()
