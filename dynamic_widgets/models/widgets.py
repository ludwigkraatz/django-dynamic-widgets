from django.db.models import fields, Model
from django.db.models.fields import related

from dynamic_widgets.abstract_models import abstractWidget
from dynamic_widgets.settings import dynamic_widgets_settings
    

class Widget(abstractWidget):
    """ This model represents an Widget and has different building Instructions """
    class Meta(abstractWidget.Meta):
        swappable = 'DYNAMIC_WIDGETS__WIDGET_MODEL'
        app_label = 'dynamic_widgets'
    
    
    is_static           = fields.BooleanField(default=True)
    
    def needs_context(self, ):
        try:
            context = self.context
            return True
        except ObjectDoesNotExist:
            return False
