
require.config({

    //deps: ["main"],
    packages: [
        {
            name: "hawk",
            main: "hawk",
            location: "../lib"
        }
    ],
    paths: {
        "json": "../lib/json2",
        "jquery": "../lib/jquery",
        "jquery-ui": "../lib/jquery-ui",
        "ajax-object": "../lib/introspective_api.object",
        "ajax": "../lib/introspective_api.client",
        "core": "../lib/dynamic_widgets.core",
        "widgets": "../lib/dynamic_widgets.editor.widgets",
        "core-widgets": "../lib/dynamic_widgets.core.widgets",
    },
});


var dynamic_widgets;
require(['jquery', 'core', 'ajax'], function ($, DynamicWidgetCore, DynamicWidgetAjax){
        
    /* prototype extension */
    $.extend(DynamicWidgetCore.prototype, {
        
        ajax: null,
        
        initEndpoints: function(callback){
            
            settings = this.config;
            
            this.ajax = new DynamicWidgetAjax({
                endpoint:   settings.endpoint,
                crossDomain: settings.crossDomain
            });
            
            this.ajax.registerExternalFailHandlers(this, this.xhrFailHandlerMap);
            this.ajax.initialize(callback);
            
        },
        
        
        _load_widget: function ($widget) {
            
            if ($widget.attr('data-widget-name') == 'widget-editor') {
                $widget.dynamic_widget_editor()
            }else{
                throw new Error('Widget name "'+$widget.attr('data-widget-name')+'" unknown')
            }
        }
        
    
    });
    
    
    $(function(){
        editor = new DynamicWidgetCore({
            endpoint: 'http://localhost:8123/api/',
            crossDomain: false
        });
    });
});