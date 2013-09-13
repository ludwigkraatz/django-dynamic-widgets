from django.template import RequestContext, Context
from .exceptions import PermissionContextError

class GlobalMixin(object):
    def _init_global_context(self):
        self._global_context    =   {}
    def _global_copy(self,duplicate):
        duplicate._global_context    =   self._global_context
        return duplicate
    @property
    def global_context(self):
        return self._global_context  
    def _repr_global(self):
        return "global_context: %s" % str(self.global_context)

class PermissionMixin(object):
    def _init_permission_context(self,request=None,process=None):
        permission_base             =   request or process
        if not permission_base:
            raise PermissionContextError(msg="no permission checker instance provided")
        self["permission_base"]  =   permission_base
    def get_permission_checker(self):
        return self["permission_base"].permission_checker
    

class DynamicContext(RequestContext,GlobalMixin,PermissionMixin):
    def __init__(self,request,*args,**kwargs):
        super(DynamicContext,self).__init__(request,*args,**kwargs)
        self._init_global_context()
        self._init_permission_context(request=request)
    def __copy__(self):
        duplicate   =   super(DynamicContext,self).__copy__()
        duplicate   =   self._global_copy(duplicate)
        return duplicate  
    def get(self, key, otherwise=None):
        if key in self.global_context:
            return self.global_context[key]
        return super(DynamicContext,self).get(key,otherwise)
    def __getitem__(self, key):
        "if key is in global_context, return it - otherwise check in other dicts"
        if key in self.global_context:
            return self.global_context[key]
        return super(DynamicContext,self).__getitem__(key)
    def __setitem__(self, key, value):
        "if a variable is in the global_context, write this one instead of others"
        if key in self.global_context:
            self.global_context[key]    =   value
        else:
            super(DynamicContext,self).__setitem__(key,value)
    def __delitem__(self, key):
        "if a variable is in the global_context, delete this"
        if key in self.global_context:
            del self.global_context[key]
        super(DynamicContext,self).__delitem__(key)
    def __contains__(self, key):
        return key in self.global_context or super(DynamicContext,self).__contains__(key)
    def __repr__(self):
        ret    =   super(DynamicContext,self).__repr__()
        ret +=  self._repr_global()
        return ret
    
class ProcessingContext(Context,GlobalMixin,PermissionMixin):
    def __init__(self,*args,**kwargs):
        process =   kwargs.pop("process",
                               None#ExpnProcess()#TODO
                               )
        super(ProcessingContext,self).__init__(*args,**kwargs)
        self._init_global_context()
        self._init_permission_context(process=process)
    def __copy__(self):
        duplicate   =   super(ProcessingContext,self).__copy__()
        duplicate   =   self._global_copy(duplicate)
        return duplicate  
    def get(self, key, otherwise=None):
        if key in self.global_context:
            return self.global_context[key]
        return super(ProcessingContext,self).get(key,otherwise)
    def __getitem__(self, key):
        "if key is in global_context, return it - otherwise check in other dicts"
        if key in self.global_context:
            return self.global_context[key]
        return super(ProcessingContext,self).__getitem__(key)
    def __setitem__(self, key, value):
        "if a variable is in the global_context, write this one instead of others"
        if key in self.global_context:
            self.global_context[key]    =   value
        else:
            super(ProcessingContext,self).__setitem__(key,value)
    def __delitem__(self, key):
        "if a variable is in the global_context, delete this"
        if key in self.global_context:
            del self.global_context[key]
        super(ProcessingContext,self).__delitem__(key)
    def __contains__(self, key):
        return key in self.global_context or super(ProcessingContext,self).__contains__(key)
    def __repr__(self):
        ret    =   super(ProcessingContext,self).__repr__()
        ret +=  self._repr_global()
        return ret
    