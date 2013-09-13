from django.template import TemplateDoesNotExist
from django.template.loader import BaseLoader
from django.conf import settings


from dynamic_widgets import get_django_template_model

class WidgetLoader(BaseLoader):
    """
    A custom template loader to load templates from the database.

    Tries to load the template from the dbtemplates cache backend specified
    by the DBTEMPLATES_CACHE_BACKEND setting. If it does not find a template
    it falls back to query the database field ``name`` with the template path
    and ``sites`` with the current site.
    """
    is_usable = True

    def load_template_source(self, widget_identifier, template_dirs=None):
        ## this loader is just used by widget API. When rendering the template, there is no more include.
        ## those includes have been preprocessed             
        
        if hasattr(widget_identifier, 'as_template_source') and callable(widget_identifier.as_template_source):  
            return widget_identifier.as_template_source() 
        else:
            DjangoTemplate = get_django_template_model()
            try:
                return DjangoTemplate.objects.get(widget__endpoint_name = widget_identifier).as_template_source()
            except DjangoTemplate.DoesNotExist:
                raise TemplateDoesNotExist
        