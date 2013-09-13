from introspective_api import serializers
from dynamic_widgets import get_widget_model, get_django_template_model, get_context_model

class WidgetContextSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    
    class Meta:
        model       =   get_context_model()
        
class DjangoTemplateSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    
    class Meta:
        model       =   get_django_template_model()

class WidgetSerializer(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    #url             =   serializers.HyperlinkedIdentityField(view_name="widget-detail", slug_field="pk")
    
    #class Header(serializers.HeaderClass):
    #    django_template =   serializers.HyperlinkedRelatedView(view_namespace='api:internal', view_name="djangotemplate-details", slug_field="django_template", slug_url_kwarg="uuid")
    #django_template    =   DjangoTemplateSerializer()#fields.RelatedField()
    
    class Meta:
        fields      =   ('id', 'endpoint_name', 'identifier', 'public',)
        model       =   get_widget_model()

class WidgetSerializerList(serializers.ModelSerializer):#Hyperlinked
    _options_class = serializers.HyperlinkedModelSerializerOptions
    url             =   serializers.HyperlinkedIdentityField(view_name="widget-detail", slug_field="pk")
    #django_template    =   ExpnUUIDSerializerField(model=models.DjangoTemplate)
    #django_template    =   DjangoTemplateSerializer()#fields.RelatedField()
    
    class Meta:
        fields      =   ('id', 'endpoint_name', 'identifier', 'public') 
        model       =   get_widget_model()
    

class WidgetSerializer(WidgetSerializer):
    class Meta(WidgetSerializer.Meta):
        view_namespace  =   "api:widgets"