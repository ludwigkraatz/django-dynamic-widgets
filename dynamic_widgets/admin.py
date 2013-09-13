from django.contrib import admin
from dynamic_widgets.models import *

admin.site.register(Widget)
admin.site.register(DjangoTemplate)
admin.site.register(DynamicContent)
#admin.site.register(JavaScriptTemplateInstruction)
#admin.site.register(JavaScriptInstruction)