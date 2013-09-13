from django.template import Template
from django.test import TestCase
from django.utils.html import escape
from django.utils.timezone import utc
from django.template.loader import render_to_string



from django.contrib.auth import get_user_model
"""
class DynamicContentTests(TestCase):
    
    def setUp(self):
        
        self.test_string =   "x"
        
        def x(request,*args,**kwargs):
            if len(args):
                return args[0]
            return self.test_string
        
        self.test_func  =   x
        
        def y(*args,**kwargs):
            raise Exception, "Exception"
        
        self.exception_func =   y
        
        self.request   =   page.AttrWrapper(
                            user                =   (get_user_model())()
                            )
        
        permissions.PermissionChecker(request   =   self.request)
        
        self.response   =   page.page.DynamicResponse(request=self.request)
        
        self.dynamic_context    =   page.context.DynamicContext(request=self.request)
        
    def check_content(self,kind,name,result,description,silent=False,orig_func=None):
        t = Template('{%% load page_content %%}{%% dynamic_%s "%s" %%}' % (kind,name))
        rendered = t.render(self.dynamic_context).strip()
        if not silent:
            self.assertEqual(rendered, escape(result),
                         msg="dynamic_%s for '%s(%s)' test failed, produced '%s', should've produced '%s'" %
                         (kind,name,description, rendered, result))
        return rendered == escape(result)
    
    def test_rendering_behaviour(self):
        \""" @brief tests if the rendering behaviour works as expected \"""
        
        self.check_content(kind="content",name="test_2",result="",description="empty content")
    
        page.register_content(name="test_2",func=self.test_func)
        
        self.check_content(kind="content",name="test_2",result=self.test_string,description="register func (func=,name=)")
        
        self.check_content(kind="content",name="test_1",result="",description="@ decorator, empty content")
        self.check_content(kind="content",name="test_3",result="",description="empty content")
        
        page.register_content(name="test_2",func=self.test_func)
        
        self.check_content(kind="content",name="test_2",result=2*self.test_string,description="register 2x")
    
    def test_mulitple_contents(self):
            
        page.register_content(name="test_multiple_contents",template="dynamic_page/test/test.html",position=20)
        page.register_content(name="test_multiple_contents",template="dynamic_page/test/test2.html",position=10)
        
        result_str  =   render_to_string("dynamic_page/test/test2.html",context_instance=self.dynamic_context)
        result_str  +=   render_to_string("dynamic_page/test/test.html",context_instance=self.dynamic_context)
        
        self.check_content(kind="content",name="test_multiple_contents",result=result_str,description="multiple contents order")
        
        page.register_content(name="test_multiple_contents",template="dynamic_page/test/test3.html",position=15)
        
        result_str  =   render_to_string("dynamic_page/test/test2.html",context_instance=self.dynamic_context)
        result_str  +=   render_to_string("dynamic_page/test/test3.html",context_instance=self.dynamic_context)
        result_str  +=   render_to_string("dynamic_page/test/test.html",context_instance=self.dynamic_context)
        
        self.check_content(kind="content",name="test_multiple_contents",result=result_str,description="multiple contents order")
        
        #TODO test seperated content list
    
    def test_visibile_if_param(self):
        pass #TODO
    
    def test_render_template(self):
        \""" @brief tests if the rendering behaviour works as expected when using templates\"""
        
        self.check_content(kind="content",name="test_template",result="",description="empty content")
    
        page.register_content(name="test_template",template="dynamic_page/test/test.html")
        
        result_str  =   render_to_string("dynamic_page/test/test.html",context_instance=self.dynamic_context)
        
        self.check_content(kind="content",name="test_template",result=result_str,description="template")
        #self.assertTrue(
        #    self.check_content(kind="content",name="test_template",result=result_str,description="template",silent=True),
        #    msg="rendering template didnt work")
           
    
    def test_content_return(self):
        \""" @brief registering a content should result in None return value \"""
        
        ret     =   page.register_content(name="test_tmp",func=self.test_func)
        
        self.assertIsNone(ret,msg="register content should be None, was '%s'" % str(ret))        
        
    def test_register_decorators(self):
        \""" @brief tests if the different decorater-use-cases work properly \"""
        
        try:
            @page.register_content(name="test_1")
            def x(*args,**kwargs):
                if len(args):
                    return args[0]
                return self.test_string
            self.fail(msg="decorator functionallity not 100% working - not for use")
        except:
            x   =   self.test_func
        
        self.assertTrue(
                callable(x),
                msg="setup decorators failed, because they changed the func. it is now '%s:%s'" %
                    (str(x.__class__),str(x))
                )
        
        self.assertEqual(
                x(self.request),
                self.test_string,msg="setup decorators failed, because they changed the func"
                )
        
        self.assertEqual(
                x(self.request,"a"),
                "a",msg="setup decorators failed, because they changed the func"
                )
        
        #self.assertRaises(
        #        excClass=page.dynamic_content.InvalidDynamicContent,
        #        callableObj=page.register_content,
        #        func=TestCase,
        #        name="test_3",
        #        msg="register content should fail when registered with a class as dyn_content func"
        #        )
        
        self.assertRaises(
            excClass=page.dynamic_content.InvalidDynamicContent,
            callableObj=page.register_content,
            func                =   x,
            msg                 =   \"""register content should fail when invoked without name\"""
            )
        
        self.assertRaises(
            excClass=page.dynamic_content.InvalidDynamicContent,
            callableObj=page.register_content,
            name                =   "test_0",
            func                =   None,
            msg                 =   \"""register content should fail when invoked without function\"""
            )
        
        
        
        pass #TODO
    
    def test_rendering_exceptions(self):
        \""" @brief tests if content with exceptions is rendered propperly \"""
        
        #TODO should depend on settings.DEBUG_TEMPLATE
        from django.conf import settings
        settings.TEMPLATE_DEBUG =   False
        
        page.register_content(name="test_0",func=self.exception_func)
        
        try:
            self.check_content(kind="content",name="test_0",result="",description="empty content")
        except BaseException, e:
            self.fail(msg="error '%s' in view not silent" % str(e))
            
        settings.TEMPLATE_DEBUG =   True
        
        try:
            self.check_content(kind="content",name="test_0",result="",description="empty content")
            self.fail(msg="error '%s' in view silent" % str(e))
        except BaseException, e:
            pass        
    

class DynamicContentMenuTests(TestCase):
    #TODO wording
    pass

class DynamicContentURLTests(TestCase):
    
    def setUp(self,*args,**kwargs):
    
        self.simple_dict          =   {
            "regex"               :   r'^tests/$',
            "func"                :   "public.views.landing"
        }
        
        self.simple_url_dict      =   {
            "view"                  :   self.simple_dict["func"],
            "regex"                  :   self.simple_dict["regex"],
            "name"                  :   None,
            "kwargs"                  :   None,
            "prefix"                  :   "",
        }
        
        self.named_dict          =   {
            "regex"               :   r'^tests/$',
            "func"                :   "public.views.landing",
            "identifier"          :   "contact__form",
            "kwargs"              :   {'a':2},
            "func_prefix"         :   "_"
        }
        
        self.named_url_dict      =   {
            "view"                  :   self.named_dict["func"],
            "regex"                  :   self.named_dict["regex"],
            "name"                  :   self.named_dict["identifier"],
            "kwargs"                  :   self.named_dict["kwargs"],
            "prefix"                  :   self.named_dict["func_prefix"],
        }

    def compare_urlregexpattern_objects(self,dyn,url,description):        
        
        self.assertEqual(
            type(dyn),
            type(url),
            msg                 =   \"""register_*** should return an '%s' object for '%s',
                                        returned '%s' instead\""" % 
                                        (str(url.__class__),str(description),str(dyn.__class__))
            )
        
        dyn_list    =   (dyn.name,dyn.regex,dyn.callback,dyn.default_args)
        url_list    =   (url.name,url.regex,url.callback,url.default_args)
        self.assertTupleEqual(
            dyn_list,
            url_list,
            msg                 =   \"""register_*** should return same object for '%s',
                                        returned '%s' instead of '%s'\""" % 
                                        (str(description),str(dyn_list),str(url_list))
            )
        

    def test_register_url_return(self):
        \"""@brief tests if a valid url pattern is returned\"""
        
        from django.conf.urls import url        
        
        simple_pattern      =   page.register_url(**self.simple_dict)
        simple_url          =   url(**self.simple_url_dict)
        
        self.compare_urlregexpattern_objects(simple_pattern,simple_url,"simple url")
        
        named_pattern       =   page.register_url(**self.named_dict)
        named_url           =   url(**self.named_url_dict)
        
        self.compare_urlregexpattern_objects(named_pattern,named_url,"complex url")
    
    
    def test_register_menu(self):
        \"""@brief registering a menu should have same result as registering an url\"""       
        
        url_pattern             =   page.register_url(**self.named_dict)
        menu_pattern          =   page.register_menu(**self.named_dict)
        
        self.compare_urlregexpattern_objects(menu_pattern,url_pattern,"menu registration")
"""
