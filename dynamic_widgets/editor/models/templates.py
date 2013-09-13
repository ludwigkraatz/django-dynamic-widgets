from django.db.models import fields
from django.db.models import Model#, DurableModel, Manager, SystemModel
from django.shortcuts import render_to_response
from django.template import RequestContext, Template


from django.db import models
from django.db.signals import pre_save

from django.db.models.query import QuerySet

class LatestVersionQuerySet(QuerySet):
    def get(self, *args, **kwargs):
        if self.query.can_filter():
            return self.filter(*args, **kwargs).latest()
        else:
            return super(LatestVersionQuerySet, self).get(*args, **kwargs)
  
class DjangoTemplateVersionManager(Manager):
    user_for_related_fields = True
    
    def create_from_orig(self, instance):
        if isinstance(instance, dict):
            def get(elem, attr):
                return elem.get(attr)            
        elif isinstance(instance, Model):
            def get(elem, attr):
                return getattr(elem, attr)
        else:
            raise Exception, "'%s', is not compatible " % instance
        #raise Exception, "'%s', is not compatible " % instance
        return self.create(
            widget_id = get(instance, 'widget'),
            orig_uuid = get(instance, 'id'),
            identifier=get(instance, 'identifier'),
            content=get(instance, 'content'),
            )
    

class DjangoTemplateVersionLatestManager(Manager):
    def get_query_set(self):
        return LatestVersionQuerySet(self.model)


class DjangoTemplateVersion(SystemModel):#, AbstractDjangoTemplate):
    """ Versions of Django Template (for editing), that can be released"""
    
    class Meta(SystemModel.Meta):
        get_latest_by = 'saved'
    
    objects         = DjangoTemplateVersionManager()
    latest_objects  = DjangoTemplateVersionLatestManager()
    
    content         = fields.TextField(blank=True, null=True)
    identifier      = fields.TextField(unique=False)
    #orig_uuid       = UUID(unique=False)
    #widget_id       = UUID(unique=False)
    saved           = fields.DateTimeField(auto_now_add=True, null=True, blank=True)
    released        = fields.BooleanField(default=False)
    opened          = fields.BooleanField(default=True)
#    new                 = fields.BooleanField(default=False)
#    version         = fields.IntegerField()
    
    def get_identifier(self, *args, **kwargs):
        return self.identifier#'%s:v%d' % (self.identifier, self.version)
    
    def render_preview_response(self, request, context_dict):
        t = Template(self.content)

        c = RequestContext(request, context_dict)
        t= t.render(c)
                         
        return render_to_response('widgets/preview.html', {'template': t},  context_instance=RequestContext(request))
