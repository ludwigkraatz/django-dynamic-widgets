from introspective_api import generics
from introspective_api.response import ApiResponse

from dynamic_widgets.editor import models as local_models
from dynamic_widgets.editor.api.dynamic_content import serializers as model_serializers

from dynamic_widgets.settings import dynamic_widgets_settings
api_endpoint = dynamic_widgets_settings.API_ROOT



class DynamicContentVersionSerializer(model_serializers.DynamicContentVersionSerializer):
    class Meta(model_serializers.DynamicContentVersionSerializer.Meta):
        view_namespace  =   "api:staff"    
    
    
class DynamicContentList(generics.ListCreateAPIView):
    """
    API endpoint that represents a list of entities.
    """
    #def get_template_names(self):
    #    return ("competences/list.part.html",)

    model = local_models.DynamicContentVersion
    serializer_class = DynamicContentVersionSerializer    
    #paginate_by = 10
    slug_url_kwarg  =   "content_identifier"
    slug_field  =   "content_identifier"
    
    def get_queryset(self):
        content_identifier = self.kwargs.get('content_identifier', None)
        if content_identifier:
            return self.model.latest_objects.filter(content_identifier=content_identifier)
        else:
            return self.model.latest_objects.all()
    
    
    
        
class OrigDynamicContentDetail(generics.RetrieveUpdateAPIView):
    
    model = local_models.DynamicContentVersion
    slug_url_kwarg  =   "orig_uuid"
    slug_field  =   "orig_uuid"
    
    def get_queryset(self):
        return self.model.latest_objects.all()
        
class DynamicContentDetail(generics.RetrieveUpdateAPIView):
    
    model = local_models.DynamicContentVersion
    pk_url_kwarg  =   "uuid"
    
    
    def get_queryset(self): # to release the most recent one
        return self.model.latest_objects.all()
    
    def put(self, request, *args, **kwargs):
        
        if request.DATA.get('action', None) == 'release':
            dyn_content = self.get_object()
            
            if release_dyn_content(dyn_content):
                return ApiResponse({"msg": "done"})
            else:
                return ApiResponse({"msg": "error"}, status = 500)
        return ApiResponse({"msg": "what to do?"}, status = 400)
    
    
api_endpoint.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "dynamic_content/(?P<uuid>[0-9\-a-zA-Z]*)",
    view  =   DynamicContentDetail,
    name        =   'dynamiccontentversion-detail'
                )
api_endpoint.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "dynamic_content/orig/(?P<orig_uuid>[0-9\-a-zA-Z]*)",
    view  =   OrigDynamicContentDetail,
    name        =   'dynamiccontentversion-detail'
                )

api_endpoint.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "dynamic_content/(?P<content_identifier>[0-9:_\-a-zA-Z]*)/versions",
    view  =   DynamicContentList,
    name        =   'dynamiccontentversion-list-filtered'
                )
api_endpoint.register_endpoint(
    root_name = 'staff',
    endpoint_url =  "dynamic_content",
    view  =   DynamicContentList,
    name        =   'dynamiccontentversion-list'
                )