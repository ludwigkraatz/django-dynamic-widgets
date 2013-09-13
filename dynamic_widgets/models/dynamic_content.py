from django.db.models import fields, Model

class DynamicContent(Model):
    class Meta:
        unique_together =   (('group', 'identifier'), )
        swappable = 'DYNAMIC_WIDGETS__DYNAMIC_CONTENT_MODEL'
    
    # how is the content included
    group               =   fields.TextField(blank=False, null=False)
    
    # what is this specific content about
    identifier          =   fields.TextField(blank=False, null=False)
    
    content             =   fields.TextField(blank=True, null=True)
    position            =   fields.IntegerField(blank=True, null=True)
    condition           =   fields.TextField(blank=True, null=True)