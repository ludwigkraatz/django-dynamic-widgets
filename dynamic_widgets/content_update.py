
from django.db.utils import IntegrityError


from dynamic_widgets import get_content_model
DynamicContent = get_content_model()

from django.conf import settings

#from  import get_dynamic_content, initiate_update_dynamic_content


def update_content_store():    
    
    listed_widgets = []
    
    # update widgets
    for widget_instruction in get_dynamic_content(instance_type=settings.EXPN__INSTANCE_TYPE.lower()):
        
        listed_widgets.append((widget_instruction['identifier'], widget_instruction['content_identifier']))
        
        widget_dict = widget_instruction.copy()
        try:
            w, created = DynamicContent.objects.get_or_create(**widget_dict)
        except IntegrityError:
            DynamicContent.objects.get(
                identifier = widget_instruction['identifier'],
                content_identifier = widget_instruction['content_identifier']
                ).delete()
            w, created = DynamicContent.objects.get_or_create(**widget_dict)
        
            
    # remove old widgets
    for content in DynamicContent.objects.all():
        if (content.identifier, content.content_identifier) not in listed_widgets:
            content.delete()
    
    return True


def release_dyn_content(hosts = ['localhost:8002', ]): #TODO: Hosts
    done = True
    
    for host in hosts:
        done = done and initiate_update_dynamic_content(host)
    
    return done