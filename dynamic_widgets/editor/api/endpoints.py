from dynamic_widgets.settings import dynamic_widgets_settings
api_root = dynamic_widgets_settings.API_ROOT


from dynamic_widgets.editor.api.views import *

templates = api_root.register_endpoint(     'templates',
    view            =   TemplateList,
    view_name       =   'template-list')
template  = templates.register_filter(                  "template__identifier", "[0-9\-_a-zA-Z]*",
    view            =   TemplateDetail,
    view_name       =   'template-details')

templates = api_root.register_endpoint(     'content',
    view            =   ContentList,
    view_name       =   'content-list')
template  = templates.register_filter(                  "content__identifier", "[0-9\-_a-zA-Z]*",
    view            =   ContentDetail,
    view_name       =   'content-details')