import json as simplejson

from django.utils.functional import SimpleLazyObject
from django import template
from django import shortcuts

from introspective_api import generics
from introspective_api.response import ApiResponse

from dynamic_widgets.api import serializers
from dynamic_widgets import get_widget_model, get_js_model, get_css_model, get_django_template_model, get_context_model
from dynamic_widgets.settings import dynamic_widgets_settings

from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

class WidgetList(generics.ListCreateAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_widget_model()
    serializer_class = serializers.WidgetSerializer
        
    lookup_field  =   "identifier"

class WidgetDetail(generics.RetrieveAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_widget_model()
    serializer_class = serializers.WidgetSerializer
        
    lookup_field  =   "identifier"
    
    def get_object(self, *args, **kwargs):
        try:
            obj = super(WidgetDetail, self).get_object(*args, **kwargs)            
        except Http404:
            if self.kwargs[self.endpoint.name] == 'widget-editor':# TODO: test if editor is installed app
                from dynamic_widgets.editor import editor_widget
                return editor_widget
            else:
                raise
    
    

class WidgetContext(generics.RetrieveAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_context_model()
    serializer_class = serializers.WidgetContextSerializer
        
    lookup_field  =   "identifier"
    export_context = True
    
    def get(self, request, return_as=None, *args, **kwargs):
        return ApiResponse(self.get_object())    
    
    def get_object(self, queryset=None):
        # Determine the base queryset to use.
        if queryset is None:
            queryset = self.filter_queryset(self.get_queryset())
        else:
            pass  # Deprecation warning
        
        lookup = None
        
        lookup = template.RequestContext(self.request)
        
        if queryset.filter(widget__isnull=True).exists():
            general_context = queryset.get(widget__isnull=True)
            
            context = general_context.get_context_for_request(self.endpoint, self.request, context=context)
            if lookup:
                lookup.update(context)
            else:
                lookup = context
        
        try:
            local_context = super(WidgetContext, self).get_object(queryset)
            
            context = local_context.get_context_for_request(self.endpoint, self.request, context=context)
            if lookup:
                lookup.update(context)
            else:
                lookup = context
            
        except (ObjectDoesNotExist, Http404):
            local_context = None
        
        if lookup is None:
            raise Exception, 'no context' # TODO
        
        if local_context:                
            if not set(local_context.get_lookups().keys()).issubset(set(lookup.keys())):
                pass # TODO: send notification
            
            if self.export_context:
                new_lookup = {}
                for key in local_context.get_lookups().keys():
                    if key in lookup:
                        new_lookup[key] = lookup[key]
                        
                lookup = new_lookup                
        else:
            if self.export_context:
                return {}
            
        return lookup

    
    
class TemplateContent(generics.RetrieveAPIView):
    """
    API endpoint that represents a list of entities.
    """

    model = get_django_template_model()
    serializer_class = serializers.DjangoTemplateSerializer
    export_context = False
    
    def get_object(self, *args, **kwargs):
        try:
            obj = super(TemplateContent, self).get_object(*args, **kwargs)            
        except Http404:
            if self.kwargs['widget__identifier'] == 'widget-editor':# TODO: test if editor is installed app
                from dynamic_widgets.editor import editor_template
                return editor_template
            else:
                raise
        
    
    def get(self, request, return_as=None, *args, **kwargs):    
        try:
            content = shortcuts.render_to_response(
                    self.get_object(),
                    context_instance=self.get_related_object('context', {'export_context': False})
                )
            return ApiResponse({'html': content})  
        except Exception:
            from django.conf import settings
            if settings.TEMPLATE_DEBUG:
                raise
            else:
                construction = self.get_construction_object()
                if construction:
                    content = {
                        'html': shortcuts.render_to_response(
                                construction,
                                context_instance=self.get_related_object('context', {'export_context': False})
                            )   
                    }
                else:
                    content = {}
                    
                return ApiResponse(content, status_code=503) # TODO Header etc.
    
    def get_construction_object(self, ):       
        queryset = self.filter_queryset(self.get_queryset())
        
        if queryset.filter(widget__identifier='under_construction').exists():
            return queryset.get(widget__identifier='under_construction')
        return None    
 
class GetJS(generics.RetrieveAPIView):
    def get(self, request, *args, **kwargs):
        content = get_js_model().objects.as_file()
        
        # Core: if GetJS.ID at client < at server: reload core&widgets
        return HttpResponse(content, content_type='text/javascript')


class GetCSS(generics.RetrieveAPIView):
    def get(self, request, *args, **kwargs):
        content = get_css_model().objects.as_file()
        
        # Core: if GetJS.ID at client < at server: reload core&widgets
        return HttpResponse(content, content_type='text/css')