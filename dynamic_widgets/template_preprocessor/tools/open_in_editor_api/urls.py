from django.conf.urls.defaults import *


from dynamic_widgets.template_preprocessor.tools.open_in_editor_api.views import open_in_editor


urlpatterns = patterns('',
    url(r'^$', open_in_editor)
)

