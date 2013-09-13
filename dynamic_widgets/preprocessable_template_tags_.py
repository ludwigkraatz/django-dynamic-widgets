from django import template
#from django.template.defaulttags import register
from django.template.loader import render_to_string
import random

import itertools
from django.utils.html import escape, force_text
from django.contrib.contenttypes.models     import  ContentType

from .. import dynamic_page_content
from .. import consts
#from  import DynamicResponse

from ..exceptions import *


from dynamic_widgets.template_preprocessor.core.preprocessable_template_tags import preprocess_tag, NotPreprocessable

def secure_render(func,*args,**kwargs):
    try:
        request = kwargs.pop("request",None)
        
        ignore_request  =   kwargs.pop("ignore_request",False)
        if func == DynamicResponse:
            func_       =   DynamicResponse(request,register_response=False,**kwargs).generate_with(*args,**DynamicResponse.clear_dynamic_kwargs(**kwargs)).get_rendered_content
            kwargs      =   {}
            args        =   []
            ignore_request  =   True
        else:
            func_    =   func
            
        if not ignore_request and request:
            ret = func_(request,*args,**kwargs)
        else:
            ret = func_(*args,**kwargs)
            
        if not isinstance(ret,basestring):
            raise DynamicContentError(msg="'%s' was no string" % str(ret))
        
        return ret
    except:
        from django.conf import settings
        if settings.TEMPLATE_DEBUG:
            raise
        else:
            return ""
        

class DynamicContentContainer(template.Node):
    """
    Container Node that loads all registered Entries of a specific Content and renderes them
    """
    def __init__(self,content_name,seperator_list,varname=None,ignore_request=False,content_kind=None):
        self.content_name_var   =   None
        self.content_name       =   None
        self.content_kind       =   content_kind
        self.ignore_request     =   ignore_request
        if content_name[0] == content_name[-1] and content_name[0] in ["'",'"']:
            self.content_name = content_name[1:-1]
        else:
            self.content_name_var = template.Variable(content_name)
        self.seperator_list     =   seperator_list

    def render(self, context):
        if self.content_name_var:
            content_name    =   self.content_name_var.resolve(context)
        else:
            content_name    =   self.content_name
            
         # generator with view functions responses, that have been registered for specific content
        content_list    =   (               
                secure_render(
                                    func=func,
                                    *args,
                                    accepted=consts.RESPONSE_AS_STRING,         # should be rendered as string, not as HTTPResponse
                                    request=context["request"],
                                    ignore_request  =   self.ignore_request,
                                    **kwargs)
                    for func,args,kwargs in
                        dynamic_page_content.get_by_kind(self.content_kind)(content_name,context)  # get registered ContentEntries tuples, for content_name
                )
        return ("".join([node.render(context) for node in self.seperator_list])).join(content_list)

@preprocess_tag
@register.assignment_tag(takes_context=True)
def dynamic_links(context,link_name):
    return [
        [dynamic_page_content.get_by_kind("menu")(link_name,context)]
        for link_name in "|".split(force_text(link_name)) # force text, because might be lazy
        ]


@preprocess_tag
@register.tag('dynamic_content')
@register.tag('dynamic_content_seperated')
def render_content(parser, token):
    params      =   token.split_contents()
    tag_name    =   params[0]
    varname     =   None
    content_name=   None
    ignore_request  =   False
    
    
    if len(params)<2 or len(params)>4:
         raise template.TemplateSyntaxError, "%r tag requires 1 argument " % token.contents.split()[0]
    else:
        if "as" in params:
            index=params.index("as")
            if len(params)>index+1:
                var_name = params[index+1]
            else:
                raise template.TemplateSyntaxError, "%r tag wrong use of 'as' " % token.contents.split()[0]
        else:
            if len(params)>2:
                raise template.TemplateSyntaxError, "%r tag requires 1 arguments " % token.contents.split()[0]
    content_name=params[1]
    
    seperator_list  =   template.NodeList()
    
    if tag_name == "dynamic_content_seperated":
        node = parser.parse(('end'+tag_name,tag_name))
        token = parser.next_token()
        if token.contents == 'end'+tag_name:
            seperator_list  =   node
            parser.delete_first_token()      
    
    return DynamicContentContainer(
                        content_name=content_name,
                        seperator_list=seperator_list,
                        varname=varname,
                        ignore_request=ignore_request,
                        content_kind = "content" if not tag_name == "dynamic_links" else "menu")

@preprocess_tag
@register.tag("script_content")
def render_scripts(parser, token):
    params      =   token.split_contents()
    tag_name    =   params[0]
    varname     =   None
    content_name=   None
    ignore_request  =   False
    
    
    return GlobalContentRenderer("_javascript_store")

@preprocess_tag
@register.tag("scriptdependency_content")
def render_scriptdependencies(parser, token):
    params      =   token.split_contents()
    tag_name    =   params[0]
    varname     =   None
    content_name=   None
    ignore_request  =   False
    
    
    return GlobalContentRenderer("_scriptdependency_store")
    

    
class EvaluationNode(template.Node):
    
    def render(self,context):
        if "partials" in context:
            for name, func in context["partials"]:
                context[name]   =   (func)(permission_checker=context.get_permission_checker())
            
        return ""
    
@preprocess_tag
@register.tag
def evaluate_partials(parser,token):
    return EvaluationNode()

@preprocess_tag
@register.simple_tag(takes_context=True)
def script_dependency(context,**kwargs):
    try:
        if not "_scriptdependency_store" in context.global_context:
            context.global_context["_scriptdependency_store"]   =   []
        else:
            if kwargs in context.global_context["_scriptdependency_store"]:
                return ""
        context.global_context["_scriptdependency_store"].append(kwargs)    
        
        return ""
    except AttributeError: # Wrong Context instance. Maybe djangos NotFound() method:
        return ''


@preprocess_tag
@register.tag('script')
def store_scripts(parser, token):
    params      =   token.split_contents()
    tag_name    =   params[0]
    varname     =   None
    content_name=   None
    ignore_request  =   False
    
    script_node =   None
    
    if tag_name == "script":
        script_node = parser.parse(('end'+tag_name,))
        parser.delete_first_token()
    
    return GlobalContentStorer(store="_javascript_store",nodes=script_node)

    
    
class GlobalContentStorer(template.Node):
    def __init__(self,store,nodes):
        self.store          =   store
        self.nodes          =   nodes
    
    def render(self,context):
        if not self.store in context.global_context:
            context.global_context[self.store]   =   []
        if self.nodes:
            context.global_context[self.store].append("".join(node.render(context) for node in self.nodes))
            
        return ""
    
class GlobalContentRenderer(template.Node):
    default_content =   {
        'jquery':{'type':'text/javascript','src_rel':'js/jquery-1.8.2.min.js'},
        'jquery_custom':{'type':'text/javascript','src_rel':'js/jquery-ui-1.9.1.custom.min.js'},
        'jquery_ui':{'type':'text/javascript','src_rel':'js/jquery-ui-1.9.1.custom.min.js'},
        'jquery_ui_css':{'type':'text/css','src_rel':'css/jquery-ui-1.9.1.custom.min.css'},
        'hoverPopup':{'type':'text/javascript','src_rel':'js/hoverPopup.js'},
        'core_embedded':{'type':'text/javascript','src_rel':'js/core.embedded.js'},
        'MessagesBeta':{'type':'text/javascript','src_rel':'js/MessagesBeta.js'},
        'core':{'type':'text/javascript','src_rel':'js/core.js'},
        'widgets':{'type':'text/javascript','src_rel':'js/widgets.js'},
        'ajax':{'type':'text/javascript','src_rel':'js/ajax.js'},
            
    }
    def __init__(self,store):
        self.store          =   store
    
    def render(self,context):
        content =   context.global_context.pop(self.store,[])
        if not len(content):
            ret = ""
        elif isinstance(content[0],basestring):
            ret = "".join(content)
        elif type(content[0]) ==  dict:
            ret=""
            for entry in content:
                if "name" in entry and entry["name"] in self.default_content:
                    entry   =   self.default_content[entry["name"]]
                if "src_rel" in entry:
                    entry["src"]    =   context["STATIC_URL"]   +   entry.pop("src_rel")
                if "type" in entry and "css" in entry["type"]:
                    entry.update({'rel':"stylesheet","type":"text/css"})
                    ret +=  "<link " + " ".join(["%s='%s'" % (str(key),str(value)) for key,value in entry.iteritems()]) + " />"
                if "type" in entry and "javascript" in entry["type"]:
                    entry.update({"type":"text/javascript"})
                    ret +=  "<script " + " ".join(["%s='%s'" % (str(key),str(value)) for key,value in entry.iteritems()]) + " ></script>"
        return ret
