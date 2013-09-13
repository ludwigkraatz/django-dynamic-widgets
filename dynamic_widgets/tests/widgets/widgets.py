from django.template import Template
from django.test import TestCase
from django.template.loader import render_to_string
from django.utils.html import escape
from django.conf import settings
from django.utils.translation import activate, deactivate_all, get_language


from django.contrib.auth import get_user_model


from introspective_api.client import IntrospectiveApiClient as ApiClient


class WidgetTests(TestCase):
    fixtures = ['widgets.json']
    
    def setUp(self):
        pass
        
    def check_api(self):
        c       = ApiClient(host='localhost:8001', root='internal')
        
        instructions = c.get('widgets').to_python()
        