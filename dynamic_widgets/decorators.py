from functools import wraps

#from  import dynamic_page_content as dynamic_page_content
#from  import DynamicResponse as DynamicResponse

from django.utils.decorators import available_attrs
from functools import wraps

__all__ = ["ProvideResponseObject",
           "register_menu","register_submenu","register_url","register_content",
           "dynamic_view","dynamic_list","dynamic_value"]

class ProvideResponseObject(object):
    def __init__(self,func):
        wraps(func)
        self.func   =   func
    def __call__(self,*args,**kwargs):
        
        #kwargs.pop("accepted",None)
        return self.func(response=DynamicResponse(*args,**kwargs),*args,**kwargs)
        pass #TODO


register_menu       =   dynamic_page_content.register_menu
register_submenu    =   dynamic_page_content.register_submenu
register_url        =   dynamic_page_content.register_url
register_content    =   dynamic_page_content.register_content

def dynamic_list(function=None,list_source  =   None):

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(request,listing=list_source,*args,**kwargs):
            
            return (view_func(obj,request.response,*args,**kwargs) for obj in listing[request.response.pagination_start():request.response.pagination_end()])
            return {
                'type'                                  :   "list",
                'list'                                  :   None,
                'quantity'                              :   listing.count(),
                'pagination_site'                       :   request.response.pagination_site(),
                'pagination_results_per_site'           :   request.response.pagination_results_per_site(),
            }
        
        return _wrapped_view
    
    if function:
        return decorator(function)
    else:
        return decorator

def dynamic_value(function=None):

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(*args,**kwargs):
            
            ret     =   view_func(*args,**kwargs)
            return ret
        
        return _wrapped_view
    
    if function:
        return decorator(function)
    else:
        return decorator

def dynamic_view(function=None):

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(request,api=None,*args, **kwargs):
            
            response    =   request.response
            
            # global reponse settings
            #response.shall_render(rendered)            
            response.use_api_version(api)
            
            # view specific reponse manipulation
            response    =   view_func(request,response,*args,**kwargs)
            
            
            return response
        
        return _wrapped_view
    
    if function:
        return decorator(function)
    else:
        return decorator