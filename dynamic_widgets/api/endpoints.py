from dynamic_widgets.settings import dynamic_widgets_settings
api_root = dynamic_widgets_settings.API_ROOT


from dynamic_widgets.api.views import *
    
widgets = api_root.register_endpoint(       'widgets',
    view            =   WidgetList,
    view_name       =   'widget-list')
widget  = widgets.register_filter(                  "widget__identifier", "[0-9\-_a-zA-Z]*",
    view            =   WidgetDetail,
    view_name       =   'widget-details')
widget_context = widget.register_endpoint(                  "context",
    view            =   WidgetContext,
    view_name       =   'widget-context',
    parent_field    =   'widget')
widget.register_endpoint(                                   "content",
    view            =   TemplateContent,
    view_name       =   'widget-content',
    parent_field    =   'widget',
    depends_on      = {
        'context': widget_context
    })
widget.register_endpoint(                                   'js',
    view            =   GetJS,
    view_name            =   'widget-js',
    parent_field    =   'widget')
widget.register_endpoint(                                   'css',
    view            =   GetCSS,
    view_name            =   'widget-css',
    parent_field    =   'widget')