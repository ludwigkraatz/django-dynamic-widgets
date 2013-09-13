
from django.db.utils import IntegrityError

#from  import get_widgets, get_template_context, get_widget_template, initiate_update_widgets

from dynamic_widgets import get_widget_model, get_django_template_model
DjangoTemplate = get_django_template_model()
Widget = get_widget_model()

from django.conf import settings

def update_widget_store():    
    listed_widgets = []
    
    # update widgets
    for widget_instruction in get_widgets(instance_type=settings.EXPN__INSTANCE_TYPE.lower()):
        
        listed_widgets.append(widget_instruction['identifier'])
        t_orig, url = get_widget_template(widget_instruction['django_template'], preprocessed=False)
        if DjangoTemplate.objects.filter(identifier = t_orig['identifier']).count():
            DjangoTemplate.objects.filter(identifier = t_orig['identifier']).delete()
        t=DjangoTemplate.objects.create(**t_orig)
        widget_dict = widget_instruction.copy()
        widget_dict['django_template'] = t
        try:
            w, created = Widget.objects.get_or_create(**widget_dict)
        except IntegrityError:
            Widget.objects.get(identifier = widget_instruction['identifier']).delete()
            w, created = Widget.objects.get_or_create(**widget_dict)
        
            
    # remove old widgets
    for widget in Widget.objects.all():
        if widget.identifier not in listed_widgets:
            widget.delete()
            
    return True

def release_widgets(hosts = ['localhost:8002', ]): #TODO: Hosts
    done = True
    
    for host in hosts:
        done = done and initiate_update_widgets(host)
    
    return done
