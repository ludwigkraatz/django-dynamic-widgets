from django.http import Http404

from introspective_api import generics
from introspective_api.response import ApiResponse

from dynamic_widgets.editor import models as local_models
from dynamic_widgets.editor.api.widgets import serializers as model_serializers

from dynamic_widgets.settings import dynamic_widgets_settings
api_endpoint = dynamic_widgets_settings.API_ROOT


class DjangoTemplateVersionSerializer(model_serializers.DjangoTemplateVersionSerializer):
    class Meta(model_serializers.DjangoTemplateVersionSerializer.Meta):
        view_namespace  =   "api:staff"
    
class DjangoTemplateDetail(generics.RetrieveUpdateAPIView):
    """
    API endpoint that represents a list of entities.
    """
    #def get_template_names(self):
    #    return ("competences/list.part.html",)

    model = local_models.DjangoTemplateVersion
    serializer_class = DjangoTemplateVersionSerializer    
    #paginate_by = 10
    slug_url_kwarg  =   "widget_id"
    slug_field  =   "widget_id"
    
    def get_queryset(self):
        return self.model.latest_objects.all()
    
    def get(self, *args, **kwargs):
        try:
            return super(DjangoTemplateDetail, self).get(*args, **kwargs)
        except (Http404, self.model.DoesNotExist), e:
            #from  import get_template
            template = get_template(self.kwargs[self.slug_url_kwarg], 'django')
            self.model.objects.create_from_orig(template)
            return super(DjangoTemplateDetail, self).get(*args, **kwargs)
    
    
    
class DjangoTemplateList(generics.ListCreateAPIView):
    """
    API endpoint that represents a list of entities.
    """
    #def get_template_names(self):
    #    return ("competences/list.part.html",)

    model = local_models.DjangoTemplateVersion
    serializer_class = DjangoTemplateVersionSerializer    
    #paginate_by = 10
    
    
    
        
class DjangoTemplatePreview(generics.RetrieveUpdateAPIView):
    
    model = local_models.DjangoTemplateVersion
    pk_url_kwarg  =   "uuid"
    
    
    def get(self, request, *args, **kwargs):
        
        template = self.get_object()
        
        return ApiResponse({'msg': template.render_preview_response(request, request.DATA)})
    
    def put(self, request, *args, **kwargs):
        
        if request.DATA.get('action', None) == 'release':
            template = self.get_object()
            
            if release_template(template):
                return ApiResponse({"msg": "done"})
            else:
                return ApiResponse({"msg": "error"}, status = 500)
        return ApiResponse({"msg": "what to do?"}, status = 400)
    
    
api.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "templates/django/(?P<uuid>[0-9\-a-zA-Z]*)/preview",
    view  =   DjangoTemplatePreview,
    name        =   'djangotemplateversion-preview'
                )

api.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "templates/django/(?P<uuid>[0-9\-a-zA-Z]*)",
    view  =   DjangoTemplatePreview,
    name        =   'djangotemplateversion-details'
                )
#
#api.register_endpoint(
#    root_name = 'staff',
#    endpoint_url =  "templates/django",
#    view  =   DjangoTemplateList,
#    name        =   'djangotemplateversion-list'
#                )

api.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "widgets/(?P<widget_id>[0-9\-a-zA-Z]*)/templates/django/versions",
    view  =   DjangoTemplateList,
    name        =   'djangotemplateversion-list'
                )