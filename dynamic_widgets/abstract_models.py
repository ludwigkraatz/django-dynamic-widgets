from django.db.models import fields, Model

class abstractWidget(Model):
    """ This model represents a Widget and has different building Instructions """
    class Meta:
        abstract = True
    identifier              = fields.TextField(unique=True)
    
    public                  = fields.BooleanField(default=False)
    staff                   = fields.BooleanField(default=False)

    endpoint_name           = fields.TextField()
    endpoint_description    = fields.TextField(blank=True, null=True)



class abstractDjangoTemplate(Model):
    """ This model contains the pure Django Template in order to build a widget server side"""
    class Meta:
        abstract = True
    
    def __init__(self, *args, **kwargs):
        super(abstractDjangoTemplate, self).__init__(*args, **kwargs)
        self._preprocessed_content = None
    
    def get_preprocessed(self, *args, **kwargs):
        if not self._preprocessed_content:
            self.preprocess()
        return self._preprocessed_content
    
    def get_context_lookup(self, *args, **kwargs):
        if not self.context_lookups:
            self.preprocess()
        return self.context_lookups
    
    def as_template_source(self,):
        return self.content, self.widget_id
    
    
    @classmethod
    def preprocess_content(cls, identifier, content, **settings):
        # settings determine how to preprocess the template
        ## e.g. dynamic content for customer A is defferent than dynContent for customer B
        ## target customer is one attr of settings
        
        from dynamic_widgets.template_preprocessor.core import compile
        from dynamic_widgets.template_preprocessor.core.context import Context
        from dynamic_widgets.template_preprocessor.utils import get_options_for_path, execute_precompile_command
        
        # Precompile command
        execute_precompile_command()
        
        # TODO: settings => Context
        
        # Compile template
        return compile(
                        content,
                        path            =   identifier,
                        loader          =   lambda path: cls.objects.get(identifier=path).content,
                        options         =   get_options_for_path(identifier),
                        context_class   =   Context
                        )
    
    def preprocess(self):        
        # Compile template
        self._preprocessed_content, context = self.preprocess_content(self.identifier, self.content)
        self.context_lookups = context.get_lookups()
    
    def get_context_for(self, user, context_dict):
        context_dict = context_dict or {}
        from django.contrib.auth import get_user_model
        ret = {}
        context_lookup = self.get_context_lookup()
        handled_lookups = [
            'account',
            'inquiry',
            'get_first_inquiries',
            'get_inquiry_pages',
            ]
        for lookup in context_lookup:
            lookups = lookup.split('|')[0]
            lookups = lookups.split('.')
            
            cur_lookup = lookups[0]
            if cur_lookup not in handled_lookups:
                continue
            user = get_user_model().objects.select_related().get(pk=user.pk)
            if cur_lookup == 'account':
                obj = user
            elif cur_lookup == 'inquiry':
                inquiry = context_dict.get('inquiry')
                if inquiry is None:
                    if 'get_first_inquiries' in context_lookup:
                        if context_dict["source"] == "own":
                            obj = user.all_inquiries.get_first_inquiries()
                        elif context_dict["source"] == "foreign":
                            obj = user.forwards.get_first_forwards()
                        else:
                            raise Exception
                        cur_lookup = 'get_first_inquiries'
                    else:
                        continue
                else:
                    obj = user.all_inquiries.filter(visible=True).get(id=inquiry)
            elif cur_lookup == 'get_first_inquiries':
                if context_dict["source"] == "own":
                    obj = user.all_inquiries.get_first_inquiries()
                elif context_dict["source"] == "foreign":
                    obj = user.forwards.get_first_forwards()
                else:
                    raise Exception
            elif cur_lookup == 'get_inquiry_pages':
                if context_dict["source"] == "own":
                    obj = user.all_inquiries.get_page_number()
                elif context_dict["source"] == "foreign":
                    obj = user.forwards.get_page_number()
                else:
                    raise Exception
            if cur_lookup not in ret:
                if type(obj) == list:
                    ret[cur_lookup] = [{} for x in obj]
                elif type(obj) == int:
                    ret[cur_lookup] = obj
                else:
                    ret[cur_lookup] = {}
            lookup_ret = ret[cur_lookup]
            
            def make_lookups(lookups, lookup_ret, obj):
                
                if type(lookup_ret) == list:
                    for member_nr in range(0, len(obj)):
                        dic = lookup_ret[member_nr]
                        make_lookups(lookups, dic, obj[member_nr])
                        lookup_ret[member_nr] = dic
                else:
                    for lookup in lookups:
                        lookup_ret[lookup] = lookup_ret[lookup] if lookup in lookup_ret else {}
                        
                        if hasattr(obj, lookup):
                            obj = getattr(obj, lookup)
                            if callable(obj):
                                obj = obj()
                            elif hasattr(obj, 'all'): #TODO isinstance Related Field
                                obj = obj.all()
                        else:
                            raise Exception, lookup #TODO
                        
                        if isinstance(obj, list):
                            lookup_ret[lookup] = obj
                        elif isinstance(obj, Model):
                            lookup_ret[lookup] = lookup_ret[lookup] if lookup in lookup_ret else {}
                        elif isinstance(obj, dict):
                            lookup_ret[lookup].update(obj)
                        else:
                            lookup_ret[lookup] = obj
                            
                        lookup_ret  =   lookup_ret[lookup]
                        
            make_lookups(lookups[1:], lookup_ret, obj)
                
        return ret