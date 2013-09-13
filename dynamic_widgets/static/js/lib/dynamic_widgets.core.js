
define(['widgets'], function($){
    function DynamicWidgetCore() {
        this.init.apply(this, arguments); 
    }
    
    /* prototype extension */
    $.extend(DynamicWidgetCore.prototype, {
        
        discovered_endpoints: {},
        
        // jquery
        $: $,
        
        // public ajax request
        ajax: null,
        
        autocomplete_cache: {},// todo remove
        
        active_language_code: null,
        config: null,
        authEndpointHost: null,
        
        // root target - dynamic-widgets just interact within such a container
        // also 
        $root_targets: null,
        $language_selector: null,
        
        xhrFailHandlerMap: {
                503:{
                    'maintenance':function(context){
                        context.this.showMaintenance(responseJSON);
                    }
                },
                401:{
                    'auth missing':function(context){
                                        if (!context.apiClient.locked) {
                                                context.apiClient.lock();
                                                context.this.openPopupFromResponse(
                                                    context.error,
                                                    context.response,
                                                    context.methodMap.processInteraction
                                                )   
                                            }
                    },
                    'UNAUTHORIZED': function(context){
                        return context.methodMap.proceedFailure()
                    }
                }
            },
        
        init: function(settings){
            var $this = this;
            
            this.config = settings;
            
            this.$root_targets = this.$('.dynamic-widget-container');
            
            this.init_coreWidget_bindings(this.$root_targets);
                
            //this.ajax = new DynamicWidgetAjax(this);
            
            this.init_language()
            
            this.initEndpoints(function(){                
                dynamic_widgets = $this.ajax.access('dynamic-widgets');
                $this.scan.apply($this)
            });
            
        },
        
        init_language: function(){
            this.$language_selector = this.$('#dynamicWidgetsSelectLanguage');
            
            if (this.$language_selector.size() == 1){                
                var $this = this;
                this.$language_selector.bind('change.dynamic-core.dynamic-language', function(){
                    var newVal = $this.$language_selector.val();
                    if (newVal) {
                        newVal = newVal.toLowerCase();
                        if ($this.active_language_code != newVal) {
                            $this.active_language_code = newVal;
                            $this.ajax.setLanguage($this.active_language_code);
                            $this.refresh()
                        }   
                    }
                })
                this.$language_selector.triggerHandler("change.dynamic-core.dynamic-language");
            }
        },
        
        init_coreWidget_bindings: function($target){
                        
            // set the global handlers
            $target.off('.dynamic-global-handler');
            
            $target.on('dynamic-errors.dynamic-global-handler', this.get_globalError_handler(this));
            $target.on('dynamic-warnings.dynamic-global-handler', this.get_globalWarning_handler(this));
            
            $target.on('dynamic-notification.dynamic-global-handler', this.get_notification_handler(this));
        },
        
        destroy: function(selector){
            /*
             * Use this method when some widget needs to be closed
             */
            
            var $this = this;
            
            // get the targets
            if (selector == undefined) {
                var $targets = this.$root_targets;
            }else if (typeof selector == "string") {
                var $targets = this.$(selector);
            }else if (selector instanceof this.$) {
                var $targets = selector;
            }else{
                throw new TypeError("parameter needs to be nothing, a selector string or a dynamicet.$ Selector")
            }
            
            // find in every target
            $.each($targets, function(index, target){
                
                var $target = $(target);                
                
                if ($target.hasClass('dynamic-widget')) {                    
                        
                    // a widget and destroy it
                    $this._detroy_widget($target);
                        
                }else if ($target.hasClass('dynamic-widget-container')) {

                    // every widget
                    $.each($(target).find('.dynamic-widget'), function(index, widget){
                        
                        // and destroy it    
                        $this._detroy_widget($(widget));
                    })
                    
                }else{
                    throw new TypeError("parameter needs to point to either a dynamic-widget class or dynamic-widget-container");
                }
                
            })          
            
        },
        
        
        _detroy_widget: function($widget){
            $widget.removeData();
            $widget.off(".dynamic-widget");
            $widget.html("");
        },
        
        scan: function(selector, setRoot){
            /*
             * Use this method when some content was changed dynamically and
             * dynamic objects might have been updated
             */
            // get the targets
            if (selector == undefined) {
                var $targets = this.$root_targets;
            }else if (typeof selector == "string") {
                var $targets = this.$(selector);
            }else if (selector instanceof this.$) {
                var $targets = selector;
            }else{
                throw new TypeError("parameter needs to be nothing, a selector string or a dynamicet.$ Selector");
            }
            
            if (setRoot==undefined) {
                setRoot = false;
            }
            
            if (setRoot) {
                this.$root_targets = $targets;
            }
            
            this.init_coreWidget_bindings($targets);
            
            var $ = this.$;
            var $this = this;
            // find in every target
            $.each($targets, function(index, target){
                
                var $target = $(target);              
                
                if ($target.hasClass('dynamic-widget')) {                    
                        
                    // a widget and load it
                    //$target.on('dynamic-init-widget.dynamic-core', $this.get_widgetInit_handler($widget));
                    $this._load_widget($target);
                        
                }else if ($target.hasClass('dynamic-widget-container')) {
                    // every widget
                    $.each($(target).find('.dynamic-widget'), function(index, widget){
                        var $widget = $(widget);
                        
                        // and load it   
                        //try {
                            // if not done,
                            if (! $widget.data('__initialized')) {
                                $this._load_widget($widget);
                            }
                        //} catch(e) {
                        //    console.log(e.message);
                        //}
                            
                    })
                    
                }else{
                    throw new TypeError("parameter needs to point to either a dynamic-widget class or dynamic-widget-container");
                }
                
            })
        },
        
        refresh: function(selector, setRoot){
            /*
             * when a complete new widget loading is needed, refresh does the job
             */
            
            this.destroy(selector);
            this.scan(selector, setRoot);            
        },
        
        
        _destroy_widget: function ($widget) {
            if ($widget.trigger('dynamic-destroy-widget')){
                $widget.removeData().html("");
            }
            $widget.off('.dynamic-core');
        },
        
        
        parseLinkHeader: function(link_header){
            link_header_expr = /<([a-z:/\-0-9\.?&_=]*)>; rel="([a-zA-Z0-9:/\-?= ]*)"(?:; title="([a-zA-Z0-9:/\-?= ]*)",?)*/g
            links = {}
            while (link = link_header_expr.exec(link_header)){
                name = link[3] ? link[3] : link[2];
                links[name] = link[1];
            }
            return links
        },
        
        get_failed_xhr_form_handler: function ($form, action, $widget){
            return this.get_failed_xhr_targeted_handler($form, 'dynamic-save-failed.dynamic-form', action, $widget)
        },
        
        get_failed_xhr_handler: function (action, $widget){
            return this.get_failed_xhr_targeted_handler(null, null, action, $widget)
        },
        
        get_failed_ajax_handler: function(){
            return this.get_failed_xhr_handler('', undefined)
        },
        
        get_failed_xhr_targeted_handler: function ($target, custom_event, action, $widget){
            var $this = this;
            function failed_contend(jqXHR, status, error){
                
                // parse error
                var error_data = new Array(null);
                if (jqXHR.getResponseHeader('Content-Type')) {
                    if (jqXHR.getResponseHeader('Content-Type').indexOf('application/json') !== -1) {
                        var error_data = new Array(jqXHR.responseText ? JSON.parse(jqXHR.responseText) : null);
                    }else if (jqXHR.getResponseHeader('Content-Type').indexOf('text/html') !== -1) {
                        var error_data = [dynamic.ajax.translateResponse_toJSON(jqXHR)];
                    } 
                }else{
                    // Server not available
                    var error_data = null;
                }
                
                // stop loading status in widget
                if ($widget != undefined) {
                    $widget.triggerHandler('dynamic-end-loading');
                }
                
                // show error
                
                if ($target) {
                    // nothing
                }else if ($widget) {
                    $target = $widget;
                }else{
                    $target = $this.$root_targets;
                }
                
                if ($target) {
                    $target.trigger('dynamic-errors', [action, error_data, jqXHR]);
                    if (custom_event != null)
                        $target.trigger(custom_event);  
                }
                
                              
            }
            return failed_contend;
        },
        
        get_globalError_handler: function($this){
            return function (event, action, errors, jqXHR){ // none form saving related stuff
                var notification;
                var $target = $(event.target);
                if (errors) {
                    $this.$.each(errors, function(index, elem){
                        if (elem != null){
                            
                            if (elem.html) {
                                notification = '<div class="dynamic-title">'+action+'</div>'+elem.html;
                            }else{
                                notification = '<div class="dynamic-title">'+action+'</div>';
                                notification += '<div class="dynamic-error"><div class="dynamic-msg">'+elem.msg+'</div>';                               
                                notification += '<div class="dynamic-detail">'+elem.detail+'</div>';                            
                                
                                if (jqXHR) {
                                    notification += '<div class="dynamic-response">'+jqXHR.responseText+'</div>';   
                                }
                                
                                notification += '</div>'; 
                                
                            }                            
                        }
                        else{
                            
                            notification = action + ': server nicht erreichbar';
                        }
                    }); 
                }else{
                    
                    notification = action + ': server error';
                }
                $target.triggerHandler('dynamic-notification', ['error', notification])   
                event.stopImmediatePropagation();
                return false;
            };
        },
                
        get_notification_handler: function(){
            return function(event, type, message){
                var $this = $(event.target);
                var $notification = $('<div class="dynamic-notification dynamic-notification-'+type+'"><div class="dynamic-actionbar"></div><div class="dynamic-content">' + message +'</div></div>');
                $this.prepend($notification);
                var left = $this.innerWidth()/2 - ($notification.outerWidth())/2;
                $notification.css("margin-left", left);
                if (type == "success") {
                    setTimeout(function(){$notification.remove()}, 3500);
                }else{
                    $notification.find('.dynamic-actionbar').append(' <span class="dynamic-icon-close"></span> ');
                    $notification.find('.dynamic-icon-close').on('click', function(){
                        $notification.remove();
                    })
                }
                
            }
        },
        
        openPopupFromResponse: function(code, response, callback){
            return this.openPopup(code, callback, response);
        },
        
        get_globalWarning_handler: function($this){
            return this.get_globalError_handler($this)
        },
        
        builddynamicPopupWidget: function(){
            var ret  = '<div class="dynamic-popup-window"';
            ret     += ' data-widget-name="popup"';
            ret     += ' style="display:none;"';
            ret     += ' ></div>';
            
            return ret;
        },
        
        openPopup: function(popupKind, callback, params){
            var $popup = this.$root_targets.find('.dynamic-popup-window');
            
            if (params == undefined) {
                params = {};
            }
            
            if (callback != undefined) {
                $.extend(params, {'callback': callback});
            }
                        
            if ($popup.size() == 0){
                var $target = this.$root_targets.first();
                $target.append(this.builddynamicPopupWidget());
                $popup = this.$root_targets.find('.dynamic-popup-window')
            }
            
            $popup = $popup.first();
            
            if (popupKind == 'dynamic-tos-missing') {
                $popup.tos_popup(params);
            }else if (popupKind == 'dynamic-auth-missing') {
                if (params.authMethod == 'dynamic-auth-saml2') {
                    $popup.saml2_popup(params);
                }else if (params.authMethod == 'dynamic-auth-password') {
                    // todo
                }else{
                    throw new Error('authentication method "'+params.authMethod+'" unknown')
                }
            }else{
                throw new Error('Popup name "'+popupKind+'" unknown')
            }
            
            
        },
        
        termsOfService_denied: function(){
            this.$root_targets.find('.dynamic-widget').each(function(index, elem){
                var $widget = this.$(elem);
                
                $widget.trigger('dynamic-tos-denied');
            })
        },
        
        resolve_endpoint: function (endpoint){
            if (discovered_endpoints[endpoint] == undefined){
                this.discover_endpoint(endpoint)
            }
            
            return discovered_endpoints[endpoint].url
            /*
                namespace_expr = /([a-zA-Z0-9\-_ ]):/g
                viewname_expr = /(?:[a-zA-Z0-9\-_ ]*:)*([a-zA-Z0-9\-_ ])/g
                namespaces = {}
                cur_position = this.discovered_urls
                while (namespace = namespace_expr.exec(view_name)){
                    if (! cur_position[namespace[0]]){
                        // right now there is no knowledge of this namespace
                        // discover it
                        self.discover(cur_position,namespace[1])
                    }
                }
                return ""
                this.links = links*/
        },
        
        discover: function(url, namespace){
            
        },
            
        parse_link_header: function(link_header){
            link_header_expr = /<([a-z:/\-0-9\.?_=]*)>; rel="([a-zA-Z0-9:/\-?= ]*)"(?:; title="([a-zA-Z0-9:/\-?= ]*)",?)*/g
            links = {}
            while (link = link_header_expr.exec(link_header)){
                name = link[3] ? link[3] : link[2];
                links[name] = link[1]
            }
            this.links = links
        },
        
        
        elements_selector: "[xmlns='http://exp-n.org/']",
    
        checkScripts: function(list){
    
            var scripts =
                    [
                    //[null,"/js/jquery-1.7.2.min.js","jquery"],
                    [null,"/js/highcharts.js",[
                            [null,"/js/modules/exporting.js"],
                        ]],
                    [null,"/lib/jquery-tooltip/jquery.tooltip.min.js"],
                    [null,"/jquery-ui-1.8.2.custom.min.js"],
                    [null,"/jquery.tools.min.js"],
                    [null,"/lib/jquery.bgiframe.min.js"],
                    //[null,"/lib/jquery.ajaxQueue.js","jquery-ajaxQueue"],
                    [null,"/lib/thickbox-compressed.js"],
                    [null,"/jquery.autocomplete.pack.js"],
                    [null,"/js/jquery.form.js"],
                    //[null,"/js/jquery.ba-bbq.min.js"],
                    [null,"/BaumNavigation.js"],
                    [null,"/jquery.jstree.js"],
                    [null,"/jquery.scrollTo-min.js"],
                    [null,"/ui.multiselect.js"],
                    //[null,"/js/core.js","core"],
            ];
    
            var domain="https://media.exp-n.org"
            var head = document.getElementsByTagName('body').item(0);
    
            // Include the individual files
            function loadScripts(scripts){
                $.each(scripts, function (i, file) {
                    if (file[0]==null){
                        $.getScript(domain+file[1],function(data, textStatus, jqxhr) {
                            if ((file.length>2)&&(file[2].length)){
                                loadScripts(file[2]);
                            }
                        });
                    }
                });
            }
    
        loadScripts(list);//scripts);
        },
        
        
        
        initEndpoints: function(){
                throw Error("not implemented")
            
        },
        
        setCredentials: function(accessId, accessSecret, accessAlgorithm) {
                throw Error("not implemented")
                
        },
        
        _load_widget: function ($widget) {
                throw Error("not implemented")
        },
        
        getAuthStatus: function(callback){
            this.ajax.refreshCredentials({
                expectsResult: true,
                callback: function(result){
                    callback(result)
                }
            })
        },
        
        login: function(settings, callback){
            if (settings.auth === 'credentials') {
                this.ajax.login(settings.username, settings.password, function(result){
                    if (result.auth === true) {
                        return callback({
                            isAuthenticated: true,
                        })
                    }else{                        
                        return callback({
                            isAuthenticated: false,
                        })
                    }
                });
            }else{
                throw Error('not known login method')
            }
        }
        
    }); 
    
    return DynamicWidgetCore
});