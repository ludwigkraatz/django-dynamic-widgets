
#from  import dynamic_objects      as  dynamic_objects

import django.core.urlresolvers as urlresolvers

__all__=[
        "DynamicContent","InvalidDynamicContent",
         "dynamic_page_content"
         ]

class InvalidDynamicContent(Exception):
    pass

class DynamicContent(object):
    """
    Dynamic Content object contains the entries, one can register via page.register_***
    It also handles the registration itself via the proxied entry(***) function
    
    ***_object: defines the Object that handles the kwargs and is being stored
    ***_return: defines the function that should be called on the stored object to get the return value
    """
    def __init__(self):
        self.urls = {
            None:[],
        }
        self.menus = {
            None:[],
        }
        self.submenus = {
            None:[],
        }
        self.contents = {
        }
        
    
    def register_menu(self, *args,**kwargs):
        """
        adds menu and an url entry
        """        
        return  self.entry("menu",*args,**kwargs) or             \
                self.entry("url",*args,**kwargs)
    def register_menu_function(self, *args,**kwargs):
        self.entry_function("menu",*args,**kwargs)
    def register_submenu(self, *args,**kwargs):
        """
        adds submenu and an url entry
        """
        return  self.entry("submenu",*args,**kwargs) or             \
                self.entry("url",*args,**kwargs)
    def register_submenu_function(self, *args,**kwargs):
        self.entry_function("submenu",*args,**kwargs)
    def menu_object(self):
        return dynamic_objects.MenuEntry
    def submenu_object(self):
        return dynamic_objects.MenuEntry
    def menu_return(self,object):
        return
    def submenu_return(self,object):
        return
    
    def get_by_kind(self,content_kind):
        return getattr(self,"get_"+content_kind)
    
    def get_content(self,content_name,context):
        """
        returns the content specified by the content_name, in an ordered list
        @param content_name: specifies the content container which should be parsed
        @return an ordered list of all entries in this container or an empty list
        """
        assert "response" in context
        if content_name in self.contents and "response" in context:
            contents    =   self.contents[content_name]
            indexes     =   contents.keys()
            indexes.sort()
            if len(indexes) and indexes[0] == None:
                indexes.append(indexes.pop(0))
                
            ordered_list    =   []
            for priority in indexes:
                if priority != None:
                    ordered_list.append(contents[priority])
                else:
                    ordered_list    +=  contents[priority]
            return (
                self.content_return_func(x)
                    for x in
                ordered_list
                    if
                context.get_permission_checker().permission_for(x) 
            )
        return []
    def get_menu(self,content_name,context):
        """
        returns the content specified by the content_name, in an ordered list
        @param content_name: specifies the content container which should be parsed
        @return an ordered list of all entries in this container or an empty list
        """
        assert "response" in context
        if content_name in self.menus and "response" in context:
            contents    =   self.menus[content_name]
            indexes     =   contents.keys()
            indexes.sort()
            if len(indexes)>1 and indexes[0] == None:
                indexes.append(indexes.pop(0))
                
            ordered_list    =   []
            for priority in indexes:
                if priority != None:
                    ordered_list.append(contents[priority])
                else:
                    ordered_list    +=  contents[priority]
            return (
                self.menu_return_func(x)
                    for x in
                ordered_list
                    if
                context.get_permission_checker().permission_for(x) 
            )
        return []
    def register_content(self,*args,**kwargs):
        return self.entry("content",*args,**kwargs)
    def register_content_function(self, *args,**kwargs):
        self.entry_function("content",*args,**kwargs)
    def content_object(self):
        return dynamic_objects.ContentEntry
    def content_return(self,object):
        return None
    def content_return_func(self,object):
        return object.get_func(),object.get_args(),object.get_kwargs()
    def menu_return_func(self,object):
        return object
    
    def register_url(self, *args,**kwargs):
        return self.entry("url",*args,**kwargs)
    def register_url_function(self, *args,**kwargs):
        self.entry_function("url",*args,**kwargs)
    def url_object(self):
        return dynamic_objects.UrlEntry
    def url_return(self,object):
        return object.getUrlPattern()
        
        
    def entry(self, entry_name, *args, **kwargs):
        """
        @brief handles the whole registration of every content type
        @param ret_func decides, whether the func or a content specific return value should be returned
        @return depends on entry_name (content type) and ret_func
        """
        name        =   kwargs["name"] if "name" in kwargs else None
        position        =   kwargs["position"] if "position" in kwargs else None
        ret_func = kwargs.pop("ret_func",False) #
        
        if not ("func" in kwargs or "template" in kwargs):
            raise InvalidDynamicContent("""func argument missing""")
            if len(kwargs.keys()) == 0:
                if len(args) == 1 and callable(args[0]):
                    # e.g. @register.***
                    kwargs["func"]    =   args[0]
                    ret_func          =     True
                else:
                    raise InvalidDynamicContent("""func argument missing""")
                
            if not "func" in kwargs:
                if  len(args) or len(kwargs.keys()):
                    # e.g. @register.***('somename') or @register.***(name='somename',..)
                    def dec(func):
                        if not func:
                            raise InvalidDynamicContent("""func argument missing""")
                        return getattr(self,"register_"+entry_name)( *args, func=func, ret_func = True, **kwargs)
                    return dec
                
                raise InvalidDynamicContent("""func argument missing""")
        else:
            if not "template" in kwargs:
                if isinstance(kwargs["func"],basestring):
                    try:
                        kwargs["func"]  =   urlresolvers.get_callable(
                                                ((kwargs["func_prefix"]+".") if "func_prefix" in kwargs else "")+
                                                kwargs["func"]
                                            )
                    except BaseException, e:
                        raise InvalidDynamicContent("""func is not valid!
                            error was '%s'""", (str(e)))
                else:
                    if not callable(kwargs["func"]):
                        raise InvalidDynamicContent("""func is not valid!
                            it is not callable""")
                    #if not isinstance(kwargs["func"],(type(self.__init__),type(urlresolvers.get_callable))):
                    #    raise InvalidDynamicContent("""func is not valid!
                    #        it is not function, but '%s'""" % str(kwargs["func"]))
        
        if "content" in kwargs:
            if type(kwargs["content"]) != dict:
                raise InvalidDynamicContent("""content arg should be dict 
                    and is '%s'""", (str(kwargs)))
            content =   kwargs.pop("content")
            for key in content.keys():
                self.register_content(
                    name            =   key,
                    position        =   content[key],
                    **kwargs
                    )
        
        obj             =   getattr(self,entry_name+"_object")()(**kwargs)
        
        if name:
            if not name in getattr(self,entry_name+"s"):
                getattr(self,entry_name+"s")[name]  =   {None:[]}
            if position == None:
                getattr(self,entry_name+"s")[name][position]  +=  [obj]
            else:
                getattr(self,entry_name+"s")[name][position]   =   obj
        else:
            if position == None:
                if position not in getattr(self,entry_name+"s"):
                    raise InvalidDynamicContent, "content needs a name "
                getattr(self,entry_name+"s")[position]  +=  [obj]
            else:
                getattr(self,entry_name+"s")[position]   =   obj
        if ret_func:
            return kwargs["func"]
        return getattr(self,entry_name+"_return")(obj)
    
        #else:
        #    raise InvalidDynamicContent("Unsupported arguments to "
        #        "DynamicContent.%s: (%r, %r)", (entry_name, name, compile_function))
            
        
        #if name is None and compile_function is None:
        #    # @register.tag()
        #    return getattr(self,entry_name+"_function")
        #if name is not None and compile_function is None:
        #    #if callable(name):
        #    #    # @register.tag
        #    #    return getattr(self,entry_name+"_function")(name)
        #    #else:
        #        # @register.tag('somename') or @register.tag(name='somename')
        #        def dec(func):
        #            return getattr(self,entry_name)(name, func)
        #        return dec
        #elif name is not None and (
        #        compile_function is not None
        #            or
        #        kwargs != {}
        #        ):
        #    # register.tag('somename', somefunc)
        #    getattr(self,entry_name+"s")[name] = getattr(self,entry_name+"_object")(**kwargs)
        #else:
        #    raise InvalidDynamicContent("Unsupported arguments to "
        #        "DynamicContent.%s: (%r, %r)", (entry_name, name, compile_function))

    def entry_function(self, entry_name,  *args, **kwargs):
        pos     =   kwargs.get("position",None)
        attr    =   getattr(self,entry_name+"s")
        if pos:
            if pos in attr:
                raise InvalidDynamicContent(
                        """Position in '%d' not unique for
                        dynamic content '%s': '%s' and '%s'"""
                        , (pos,entry_name,kwargs['identifier'],attr[pos]['identifier'])
                        )
            attr[pos] = getattr(self,entry_name+"_object")(**kwargs)
        return func
    

dynamic_page_content        =   DynamicContent()
