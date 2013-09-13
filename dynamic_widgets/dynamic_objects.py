from django.conf.urls import url
from django.shortcuts import render_to_response
#from  import DynamicResponse


class DynamicObject(object):
    
    _visibility_checker =   None
    
    def __init__(self,*args,**kwargs):
        self.attrs  =   kwargs
        
        self.create_visibility_checker()
        
    def create_visibility_checker(self):
        """ @brief creates a VisibilityChecker Instance for this object"""
        if "visible_if" in self.attrs:
            #TODO
            self._visibility_checker   =   VisibilityChecker(self.attrs.pop("visible_if"))
        
    def __getitem__(self,key):
        return self.attrs.get(key,None) or self.default_for(key)
    def default_for(self,key):
        key =   str(key)
        if hasattr(self,"default_for_"+key):
            return getattr(self,"default_for_"+key)()
        raise KeyError, ("'%s' not in '%s'" % (key,self.attrs))
    def getEntry(self,context):
        ret =   {}
        #if "path" in context:
        #    if hash(resolve(context[path])[1])==hash(self["func"]):
        #        ret.update("is_active",True)
        ret.update(self.attrs)
        return self.attrs.copy()
    def get_func(self):
        return self["func"] if "func" in self.attrs else DynamicResponse
    def get_args(self):
        return []
    def get_kwargs(self):
        if "func" in self.attrs:
            return self["kwargs"] if "kwargs" in self.attrs else self["extraOptions"] # TODO "in self"
        else:
            return {'template':self.attrs['template']}
    def default_for_extraOptions(self):
        return {}
    def default_for_identifier(self):
        return None
    def is_visible_for(self,context):
        return True


class ContentEntry(DynamicObject):
    """
    Wrapper for content entries.
    needs a func parameter, that is beeing called when the response is generated.
    args and ekwargs can be passed for calling that func
    """

class UrlEntry(DynamicObject):
    """
    wrapper for URL entries.
    returns a tuple that can be stored within url_patterns
    URLEntries need a regex, func and optional extraOptions argument
    """
    def getUrlPattern(self):
        return url(
                    self['regex'],
                    self['func'],
                    self.get_kwargs(),
                    name    =   self["identifier"],# if "identifier" in self.attrs else None, # TODO: "in self"
                    prefix  =   self["func_prefix"]
                )
    def default_for_func_prefix(self):
        return None
    def default_for_func(self):
        def inline_view(request,*args,**kwargs):
            return render_to_response(kwargs["template"],{},context_instance=request.response.get_context_instance())
        return inline_view
    

class MenuEntry(DynamicObject):
    location = "kjl"
    def default_for_location(self):
        return "aaa"