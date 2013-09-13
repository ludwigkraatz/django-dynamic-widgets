from django.db.models import fields
from django.db.models import Model#, DurableModel, Manager, StaticLookupModel
from django.shortcuts import render_to_response
from django.template import RequestContext, Template


from django.db import models

from django.db.models.query import QuerySet

class LatestVersionQuerySet(QuerySet):
    def get(self, *args, **kwargs):
        if self.query.can_filter():
            return self.filter(*args, **kwargs).latest()
        else:
            return super(LatestVersionQuerySet, self).get(*args, **kwargs)
  
class DynamicContentVersionManager(Manager):
    user_for_related_fields = True

class DynamicContentVersionLatestManager(Manager):
    def get_query_set(self):
        return LatestVersionQuerySet(self.model)


class DynamicContentVersion(StaticLookupModel):#AbstractDjangoTemplate, StaticLookupModel):
    """ Versions of Django Template (for editing), that can be released """
    
    class Meta(StaticLookupModel.Meta):
        get_latest_by = 'saved'
    
    objects             = DynamicContentVersionManager()
    latest_objects      = DynamicContentVersionLatestManager()
    
    content             = fields.TextField(blank=True, null=True)
    content_identifier  = fields.TextField(unique=False)
    identifier          = fields.TextField(unique=False)
    #orig_uuid           = UUID(unique=False, null=False, blank=False)
    saved               = fields.DateTimeField(auto_now_add=True, null=True, blank=True)
    released            = fields.BooleanField(default=False)
    opened              = fields.BooleanField(default=True)
    position            =   fields.IntegerField(blank=True, null=True)
    condition           =   fields.TextField(blank=True, null=True)
#    new                 = fields.BooleanField(default=False)
#    version             = fields.IntegerField()
    
    def get_identifier(self, *args, **kwargs):
        return '%s:%s' % (self.content_identifier, self.identifier)
    