from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    # Uncomment the next line to enable the admin:
    url(r'^dynamic_widgets/editor/$', 'dynamic_widgets.editor.views.show_editor'),
)
