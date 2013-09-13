from django.db.models import Model, fields
from django.db.models.fields import related
from django import template

from dynamic_widgets import get_widget_model
from dynamic_widgets.abstract_models import abstractDjangoTemplate
from dynamic_widgets.settings import dynamic_widgets_settings
    
from jsonfield.fields import JSONField
from django.contrib.auth import get_user_model


class WidgetContext(Model):
    """
    in a django template, the widget is preprocessed server side.
    It is received by the JavaScript Core module. If a JavaScript Code Instance
    with the same identifier exists, it handles the received content.
    """
    class Meta:
        app_label = 'dynamic_widgets'
    
    
    widget          = related.OneToOneField(get_widget_model(), related_name='context', blank=True, null=True)
    lookups         = JSONField(blank=True, null=True)
    options         = JSONField(blank=True, null=True)
    targets         = JSONField(blank=True, null=True)
    
    def get_targets(self, ):
        if self.targets:
            return self.targets
        return {}
    
    def get_target(self, key):
        targets = self.get_targets()
        if key in targets:
            return __import__(targets[key])
        raise KeyError, '"%s" no valid target' % key
    
    def get_lookups(self, ):
        if self.lookups:
            return self.lookups
        return {}
    def get_options(self, ):
        if self.options:
            return self.options
        return {}
    
    def get_additional_context(self, endpoint, request, options, select_only=None):        
        def func_setting_keys_wrapper(request, options):
            context = func_or_dict(request=request, options=options, endpoint=endpoint)                
            setattr(func_or_dict, '_received_context_keys', getattr(func_or_dict, '_received_context_keys', []))
            
            for key in context.keys():
                if key not in func_or_dict._received_context_keys:
                    func_or_dict._received_context_keys.append(key)
            
            return context
        
        def get_context(func_or_dict):
            
            func = func_or_dict
            if select_only:
                abort_import = True
                if isinstance(func_or_dict, dict) and getattr(func_or_dict, '_received_context_keys', None) is None:
                    setattr(func_or_dict, '_received_context_keys', func_or_dict.keys())
                
                if hasattr(func_or_dict, '_received_context_keys'):
                    for required in select_only:
                        if required in func_or_dict._received_context_keys:
                            abort_import = False
                else:
                    func = func_setting_keys_wrapper
                    abort_import = False
            else:
                abort_import = False
                func = func_setting_keys_wrapper
                
            if abort_import:
                return {}
            return func(request, options) if callable(func) else func
        
        return (
            get_context(func_or_dict)
            for func_or_dict in
            dynamic_widgets_settings.ADDITIONAL_CONTEXT
            )
    
    def get_context_for_request(self, endpoint, request):
        context = context or {}
        options = {}
        
        for key, value in request.GET.iteritems():
            if key not in self.get_options():
                continue
                #raise Exception, '' #TODO: check that request.GET Attrs are just those options, that are valid (values) for this widget
            if not self.get_options()[key].match(value):
                raise Exception, 'wrong stuff'
            
            options[key] = value
            
        
        context.update(options)
        
        def complete_context(orig_context):
            context = {}
            required = set()
            for key in self.get_lookups().keys():
                if key in context or key in orig_context:
                    continue
                
                target = self.get_target(key)
                if target:
                    context[key] = target
                else:
                    if not dynamic_widgets_settings.LOCAL_CONTEXT or key in dynamic_widgets_settings.LOCAL_CONTEXT:
                        required.add(key)
            
            select_only = required
            while required:
                for context in self.get_additional_context(endpoint, request, options, select_only=select_only):
                    if not isinstance(context, dict):
                        raise Exception, 'additional context "%s" should be dict' % str(context)# TODO
                    context.update(context)
                    for key in context.keys():
                        if key in required:
                            required.remove(key)
                
                if select_only:
                    select_only = None
                else:
                    break                    
        
            orig_context.update(context)
            return orig_context
                
        return complete_context(context)   

class DjangoTemplate(abstractDjangoTemplate):
    """
    in a django template, the widget is preprocessed server side.
    It is received by the JavaScript Core module. If a JavaScript Code Instance
    with the same identifier exists, it handles the received content.
    """
    class Meta(abstractDjangoTemplate.Meta):
        app_label = 'dynamic_widgets'
        swappable = 'DYNAMIC_WIDGETS__DJANGO_TEMPLATE_MODEL'
    

    #content         = fields.TextField(blank=True, null=True)
    widget          = related.OneToOneField(get_widget_model(), related_name='django_template', blank=True, null=True)
    
    identifier      = fields.TextField(unique=True)
    content         = fields.TextField(blank=True, null=True)
    
    
    
class JavaScriptCode(Model):
    """
    the JavaScript code needed for a specific Widget. This code is packed into a js file and is included
    via. requireJS into the web page. It is structured like a jQuery plugin.
    """
    class Meta:
        app_label = 'dynamic_widgets'
        swappable = 'DYNAMIC_WIDGETS__JS_CODE_MODEL'
        
    #next            = models.ForeignKey('self', related_name='previous', blank=True, null=True)
    widget          = related.OneToOneField(get_widget_model(), related_name='java_script_code', blank=True, null=True)
    #identifier      = fields.TextField(unique=True)
    content         = fields.TextField()
    
class CSSCode(Model):
    """
    this Model contains the CSS code, for a specific Widget or the whole site (core).
    All instances are packed into the core css file.
    """
    class Meta:
        app_label = 'dynamic_widgets'
        swappable = 'DYNAMIC_WIDGETS__CSS_CODE_MODEL'
        
    #next            = models.ForeignKey('self', related_name='previous', blank=True, null=True)
    widget          = related.OneToOneField(get_widget_model(), related_name='css_code', blank=True, null=True)
    #identifier      = fields.TextField(unique=True)
    content         = fields.TextField()


#class JavaScriptTemplate(Model):
#    """ This model contains the JavaScript Template in order to build a widget client side by a Template Engine """
#    #next            = models.ForeignKey('self', related_name='previous', blank=True, null=True)
#    widget          = related.ForeignKey(getattr(settings, 'DYNAMIC_WIDGETS__WIDGET_MODEL', Widget), related_name='django_templates', blank=True, null=True)
#    identifier      = fields.TextField(unique=True)
#    content         = fields.TextField()#
    