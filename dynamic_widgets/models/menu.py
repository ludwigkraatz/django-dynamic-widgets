from django.db.models import Model, fields
from django.db.models.fields import related

from db_wordings.mixins import UsesWordingMixin
    

class MenuEntry(UsesWordingMixin, Model):
    """ This model represents an Widget and has different building Instructions """
    class Meta:
        swappable = 'DYNAMIC_WIDGETS__MENU_ENTRY_MODEL'
    
    identifier          =   fields.TextField()
    position            =   fields.IntegerField(blank=True, null=True)
    condition           =   fields.TextField(blank=True, null=True)
    parent              =   related.ForeignKey('self', related_name='children')
    
    # a root entry (containing it's children) is extracted as a standalone menu-widget
    root                =   fields.BooleanField(default=False)
"""
class Menu(UsesWordingMixin, Model):
    class Meta:
        swappable = 'DYNAMIC_WIDGETS__MENU_MODEL'
    
    identifier          =   fields.TextField()
    content             =   fields.TextField()
"""