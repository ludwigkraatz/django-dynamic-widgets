define(['jquery-ui'], function($){
    $(function() {
        
        $.QueryString = (function(a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i)
            {
                var p=a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'))
        
        $.widget( "dynamic_widgets.dynamic_widget",{
                options: {
                    width: '100%',
                    load_content: true,
                    update_content: false
                },
                
                _create: function() {
                    
                    if (! this.element.hasClass('dynamic-widget')) {
                        throw new Error('the target for "dynamic_widgets.dynamicet_widget" widget needs to have a "dynamic-widget" class');
                    }
                    
                    if (this.options.load_content  && this.options.widget_url == undefined) {
                        throw new Error('"dynamic_widgets.dynamicet_widget" needs to be initialized with an "widget_url" attribute');
                    }
                    
                    if (this.element.css('position') == 'static'){
                        this.element.css('position', "relative")
                    }
                    
                    this.element.data('__initialized', true); // otherwise dynamic_widgets.scan() would initialize it again
                    
                    this.element.off('.dynamic-dynamicet-widget');
                    this.element.on('dynamic-loading-widget-failed.dynamic-widget.dynamic-dynamicet-widget', this.get_initFailed_handler(this));
                    this.element.on('dynamic-widget-loading.dynamic-widget.dynamic-dynamicet-widget', this.get_loadingWidget_handler(this));
                    this.element.on('dynamic-init-widget.dynamic-widget.dynamic-dynamicet-widget', this.get_initWidgetDone_handler(this));
                    this.element.on('dynamic-tos-denied.dynamic-widget.dynamic-dynamicet-widget', this.get_ToSDenied_handler(this));
                    //todo:this.element.on('dynamic-notification.dynamic-widget.dynamic-dynamicet-widget', dynamic_widgets.get_notification_handler(this));
                    
                    // css widget stylesheet activation by adding widget specific class
                    this.element.addClass('dynamic-' + this.element.attr('data-widget-name'));                    
                    this.$loading = null;
                    this.$loading_toggle = null;
                    
                    // start loading
                    var $this = this;
                    
                    if (this.options.load_content || this.options.update_content) {
                        
                        if (! this.options.update_content) {
                            this.element.trigger('dynamic-widget-loading');
                        }                        
                        
                        var data = {}
                        
                        if (this.options.widget_data) {
                            $.extend(data, this.options.widget_data);
                        }
                        
                        this.element.triggerHandler('dynamic-start-loading');
                        // load and initialize it
                        widgets = dynamic_widgets.get('widgets');
                        widget = widgets.get('widget', this.options.widget_url);
                        this.element.data('_object', widget);
                                                
                        $this.element.trigger('dynamic-init-widget');
                        /*$this.element.triggerHandler('dynamic-end-loading');
                        try {
                            content.load(function(content){
                                    }
                            );
                        } catch(e) {
                            throw e;
                            $this.element.trigger('dynamic-loading-widget-failed');
                            $this.element.triggerHandler('dynamic-end-loading');
                        }*/
                    }else{
                        $this.element.trigger('dynamic-init-widget');
                    }
                    
                },
                
                get_startLoading_handler: function($this){
                    return function(event){
                        event.stopPropagation();
                        if ($this.$loading == null) {
                            return
                        }
                        if (!$this.$loading.hasClass('dynamic-active')){
                            $this.$loading.addClass('dynamic-active');
                            $this.$loading_toggle.hide()
                        }
                        $this.$loading.data('activity_counter', $this.$loading.data('activity_counter') + 1);
                    }
                },
                
                get_endLoading_handler: function($this){
                    return function(event){
                        event.stopPropagation();
                        if ($this.$loading == null) {
                            return
                        }
                        if ($this.$loading.hasClass('dynamic-active')){
                            var counter = $this.$loading.data('activity_counter');
                            if (counter == 0) {
                                return;
                            }else if (counter == 1) {
                                $this.$loading.removeClass('dynamic-active');
                                $this.$loading_toggle.show()
                            };
                            $this.$loading.data('activity_counter', counter - 1);                            
                        }
                    }
                },
                
                
                get_initFailed_handler: function($this){
                    return function (event, jqXHR, status, statusText){
                        event.stopPropagation();
                        error = dynamic_widgets.ajax.translateResponse_toJSON(jqXHR);
                        $this.element.html(error.html || jqXHR.responseText ? "error loading" : "server unavailable"); // todo
                        dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:load_widget" %}', $this.element)(jqXHR, status, statusText);
                    }
                },
                
                get_loadingWidget_handler: function($this){
                    return function(event){
                        event.stopPropagation();
                        $this.element.html('<div class="dynamic-loading-placeholder"/>'); //todo
                    }
                },
                
                get_initWidgetDone_handler: function($this){
                    return function(event){
                        // loading init
                        $this.$loading = $this.element.find('.dynamic-loading:first');
                        $this.$loading.data('activity_counter', 0);
                        $this.$loading_toggle = $this.$loading.parent().children('.dynamic-hide-for-loading');
                        
                        $this.element.on('dynamic-start-loading.dynamic-widget.dynamic-dynamicet-widget', $this.get_startLoading_handler($this));
                        $this.element.on('dynamic-end-loading.dynamic-widget.dynamic-dynamicet-widget', $this.get_endLoading_handler($this));
                               
                        event.stopPropagation();
                        //todo
                    }
                },
                
                get_ToSDenied_handler: function($this){
                    return function(event){
                        $this.html('T.o.S.')
                    }
                }
        });
        
        $.widget( "dynamic_widgets.dynamic_popup",{
                options: {
                    widget_url: null,
                    iframe_url: null,
                    ignoreLock: false
                },
                
                _create: function(){
                    
                    if (! this.element.hasClass('dynamic-popup-window')) {
                        throw new Error('the target for "dynamic_widgets.popup" widget needs to have a "dynamic-popup" class');
                    }
                    if (this.options.widget_url == null && this.options.iframe_url == null) {
                        throw new Error('the "dynamic_widgets.popup" needs a widget_url or iframe_url option');
                    }
                    
                    this.element.off('.dynamic-popup-window');
                    
                    var $this = this;
                    var $popup = this.element;
            
                    var $mask  =   $('<div class="dynamic-modal-mask">&nbsp;</div>');
                    $mask.insertAfter($popup);
                    this.$mask = $mask;
                    
                    var $content = $('<div class="dynamic-popup-content"></div>');
                    $popup.prepend($content);
                    this.$content = $content;
                    
                    
                    $popup.prepend('<div class="dynamic-popup-close right ui-icon-light ui-icon-closethick" style="margin-right:13px;margin-top: 7px;"></div>');
                    $popup.find(".dynamic-popup-close").click(function(){
                            $popup.triggerHandler('dynamic-close-popup');
                        }
                    )
                    
                    $(document).resize(function(event){
                        $popup.trigger('dynamic-center-popup');
                    });
                    $(window).resize(function(event){
                        $popup.trigger('dynamic-center-popup');
                    });
                      
                    $popup.on('dynamic-center-popup.dynamic-popup-window.dynamic-popup', function(event){
                        event.stopPropagation();
                        
                        var maskHeight = $(document).outerHeight();
                        var maskWidth = $(window).outerWidth();
        
                        //Set height and width to mask to fill up the whole screen
                        $mask.css({'width':maskWidth,'height':maskHeight});
                        
                        var winH = $(window).height();                    
                        var winW = $(window).width();
                        var top =  winH/2-$popup.height()/2;
                        var left =  winW/2-$popup.width()/2;        
        
                        //Set the popup window to center
                        $popup.css('top',  top);
                        $popup.css('left', left);
                    });
                    
                    $popup.on('dynamic-notification.dynamic-widget.dynamic-popup', dynamic_widgets.get_notification_handler(this));
                    
                    $popup.on('dynamic-close-popup.dynamic-popup-window.dynamic-popup', function(event){
                        event.stopPropagation();
                        $mask.hide();
                        $popup.hide();
                        $popup.triggerHandler('dynamic-closed-popup');
                        $popup.remove();
                        $mask.remove();
                    });
                    
                    if (this.options.widget_url) {
                        dynamic_widgets.ajax.get({
                            "url": this.options.widget_url + '/',
                            "done": this.getInitPopupHandler(this),
                            "fail": function(jqXHR, status, statusText){
                                            $this.element.trigger(
                                                'dynamic-loading-popup-failed', [
                                                    jqXHR, status, statusText
                                                ]
                                            );
                                    },
                            "ignoreLock": $this.options.ignoreLock
                        });     
                    }else if (this.options.iframe_url){
                        var response = '<div><iframe style="height:150px;width:550px;margin-top:-40px;" src="'+this.options.iframe_url+'"/></div>';
                        this.getInitPopupHandler(this)(response)
                    }
                    
                },
                
                getInitPopupHandler: function($this){
                    return function(response, text, xhr){
                
                        var $popup = $this.element;
                        var $mask = $this.$mask;
                        var $content = $this.$content;
                        
                        $content.html(response);
                        
                        $this.element.trigger('dynamic-init-popup', [
                                response, text, xhr
                            ]
                        );                        
                        
                        $popup.triggerHandler('dynamic-center-popup');
                        
                        //dynamic_modal_mask effect
                        $mask.fadeIn(500);
                        $mask.fadeTo("slow", 0.8);
                
                        //transition effect
                        $popup.fadeIn(1000);
                    }
                }
        });
        
        
        $.widget( "dynamic_widgets.dynamic_lookup_list",{
                options: {
                    source: [],
                    entriesPerPage: 1,
                    lookupTarget: null,
                },
                _create: function(){
                    var $this = this;
                    this.element.dynamic_list({
                        fillEntry: function(entry, domEntry){ 
                            var dynamic_list = this; // because its called from within the dynamic_list obj
                            entry = $this.options.lookupObject.get($this.options.lookupTarget, entry);
                            
                            entry.load(function(result){
                                if (result.wasSuccessfull) {
                                    var ret = [];
                                    $.each($this.element.dynamic_list('getHeaderFields'), function(index, header) {
                                        header = $(header);
                                        var _ret = $('<div width="' + header.width() + '"/>')
                                        _ret.html($this.options.getContentForHeader(result, header));
                                        ret.push(_ret);
                                    });
                                    
                                    $(domEntry).html(ret);  
                                }
                                
                            })
                        },
                        loadPage: function(settings, callback){             
                            var page = settings.page;
                            
                            paginatedBy = $this.options.entriesPerPage;
                            result = $this.options.source.slice((page-1)*paginatedBy, (page)*paginatedBy);
                            callback(result);
                        },
                        getLastPageNumber: function(){
                            var fullPages = parseInt($this.options.source.length / $this.options.entriesPerPage);
                            var halfFullPage = $this.options.source.length % $this.options.entriesPerPage > 0 ? 1 : 0;
                            
                            return fullPages + halfFullPage
                        },                        
                        getIdForEntry: function(entry){
                            return $this.options.getIdForEntry(entry);
                        }
                    })
                },
                
                setSource: function(source){
                    this.options.source = source;
                    this.element.dynamic_list('goToPage', 1)
                }
                
                
                
        });
        
        
        $.widget( "dynamic_widgets.dynamic_widget_list",{
                options: {},
                _create: function(){
                    var $this = this;
                    function getEntryId(entry) {
                        return entry.id
                    }
                    this.element.dynamic_list({
                        fillEntry: function(entry, domEntry){      
                            var dynamic_list = this; // because its called from within the dynamic_list obj                      
                            var ret = '<div class="dynamic-widget" data-widget-name="'+this.options.element_widgetName+'" data-uuid="' + elem.id + '">'
                            ret += '</div>'
                            $(domEntry).html(ret);
                            
                            
                            $this.options.entryCallback(entry, {
                                // update but show the inquiry if its in store
                                load_content: dynamic_list.element.data('entry-' + getEntryId(elem)) === undefined
                                });
                        },
                        loadPage: function(settings, callback){
                            var dynamic_list = this; // because its called from within the dynamic_list obj
                            var data = {
                                'page': settings.page_nr
                            }
                            
                            if (dynamic_list.element.data('sorted-by') != undefined) {
                                data['sort-method'] = dynamic_list.element.data('sorted-by')['method']; // asc|desc
                                data['sort-by'] = dynamic_list.element.data('sorted-by')['sorted-by']; // identifier
                                if (settings.letter && settings.letter != "undefined") {
                                    data['startswith']= settings.letter;
                                }   
                            }
                            
                            this.element.triggerHandler('dynamic-start-loading');
                            $this.options.lookupObject.get(
                                null,
                                data,
                                function(result){
                                    this.element.triggerHandler('dynamic-stop-loading');
                                    if (result.wasSuccessfull) {
                                                           
                                        var links = dynamic_widgets.parseLinkHeader(jqXHR.getResponseHeader('Link'));
                                        var last_page = 1
                                        if (links.last != undefined) {
                                            last_page = parseInt( links.last.split('page=')[1].split("&")[0] )
                                        }
                                        $this.element.data('last-page-nr',last_page);
                                        
                                        callback(result.getContent());
                                    }
                                })             
                        },
                
                        getLastPageNumber: function(){
                            return $this.element.data('last-page-nr') || 1;
                        },
                        
                        getIdForEntry: function(entry){
                            return getEntryId(entry)
                        }
                    })
                },});
        
        
        $.widget( "dynamic_widgets.dynamic_list",{
                options: {
                    width: '100%',
                    pagination_asAlphabet: false,
                    pagination_asPages: false,
                    pagination_asInfinite: false,
                },
                /*
                 *
                 *<div id="order_by" class="" style="display:inline-block!important;">&nbsp;</div>
                    ui-icon2 ui-icon-triangle-1-n*/
                
                /*
                 **/
                
                _create: function() {
                    
                    if (! this.element.hasClass('dynamic-list')) {
                        throw new Error('the target for "dynamic_widgets.dynamic_list" widget needs to have a "dynamic-list" class');
                    }
                    
                    /*if (this.options.endpoint == undefined) {
                        throw new Error('"dynamic_widgets.dynamic_list" needs to have an endpoint option');
                    }
                    
                    if (this.options.list_url == undefined) {
                        throw new Error('"dynamic_widgets.dynamic_list" needs to have a list_url option');
                    }*/
                        
                    //this.element.data('current_page', 1);
                    //this.updatePagination(1, this.get_lastPage())
                    
                    this.element.off('.dynamic-list', this.get_reload_handler(this));
                    
                    this.element.on('dynamic-reload-list.dynamic-list.dynamic-widget', this.get_reload_handler(this));
                    this.element.on('dynamic-zoom-list-entry.dynamic-list.dynamic-widget', this.get_zoomEntry_handler(this));
                    this.element.on('dynamic-remove-list-entry.dynamic-list.dynamic-widget', this.get_removeEntry_handler(this));
                    this.element.on('dynamic-unzoom-list-entry.dynamic-list.dynamic-widget', this.get_unzoomEntry_handler(this));
                    //todo: this.element.on('dynamic-notification.dynamic-widget.dynamic-list', dynamic_widgets.get_notification_handler(this));
                    
                    
                    this.buildHeader();
                    this.buildFooter();
                    
                    this.goToPage(1);
                      
                },
                
                getHeaderFields: function(){
                    return this.$header.find('.dynamic-list-entry-header')
                },
                
                addHeader: function(header){
                    header = $(header);
                    header.addClass('dynamic-list-entry-header');
                    this.$header.append(header);
                },
                
                buildHeader: function(){
                    
                    this.$header = this.element.children('.dynamic-header');
                    if (this.$header.size() <= 0) {
                        this.element.prepend('<div class="dynamic-header"></div>');
                        this.$header = this.element.children('.dynamic-header');
                    }
                    
                    var sortable_headers = this.$header.find('.dynamic-list-entry-header-sortable')
                    
                    if (sortable_headers.size() > 0) {
    
                        sortable_headers.wrapInner("<span/>");
                        sortable_headers.append('<span class="dynamic-icon"/>')
                        sortable_headers.on("click.dynamic-list.dynamic-widget", this.get_sortableHeaderClick_handler(this));
                        
                        var sorted = this.$header.find('.dynamic-list-entry-header-sorted-asc, .dynamic-list-entry-header-sorted-desc');
                        
                        if (sorted.size() > 1) {
                            throw Error("just one sorted header field allowed");
                        }else if (sorted.size() == 0) {
                            sorted = sortable_headers.find(':first');
                            sorted.addClass('dynamic-list-entry-header-sorted-asc');
                        }
                        
                        if (sorted.hasClass('dynamic-list-entry-header-sorted-asc')) {
                            this.element.data('sorted-by', {'method':'asc', 'sorted-by':sorted.attr('data-sort-by-identifier') });
                        }else{
                            this.element.data('sorted-by', {'method':'desc', 'sorted-by':sorted.attr('data-sort-by-identifier') } );
                        }
                    };
                    
                    if (this.$header.html() == "") {
                        this.$header.remove();
                    }
                    
                },
                
                get_sortableHeaderClick_handler: function($this){
                    return function(event){
                        event.stopImmediatePropagation();
                        
                        var $target = $(event.target).closest('.dynamic-list-entry-header-sortable');
                        var order_desc;
                        
                        
                        if ($target.hasClass('dynamic-list-entry-header-sorted-asc')) {
                            order_desc = true;
                        }else{
                            order_desc = false;
                        }
                        
                        var sorted = $this.$header.find('.dynamic-list-entry-header-sorted-asc, .dynamic-list-entry-header-sorted-desc');
                        
                        sorted.removeClass('dynamic-list-entry-header-sorted-asc').removeClass('dynamic-list-entry-header-sorted-desc');
                        
                        if (order_desc) {
                            $target.addClass('dynamic-list-entry-header-sorted-desc');
                            $this.element.data('sorted-by',{'method':'desc', 'sorted-by':$target.attr('data-sort-by-identifier') });
                        }else{
                            $target.addClass('dynamic-list-entry-header-sorted-asc');
                            $this.element.data('sorted-by', {'method':'asc', 'sorted-by':$target.attr('data-sort-by-identifier') });
                        }
                        
                        $this.reload();
                        
                    }
                },
                
                buildFooter: function(){
                    
                    this.$footer = this.element.children('.dynamic-footer');
                    if (this.$footer.size() <= 0) {
                        this.element.append('<div class="dynamic-footer"></div>');
                        this.$footer = this.element.children('.dynamic-footer');
                    }
                    
                    this.$footer.append('<div class="dynamic-pagination">\
                <div class="dynamic-left dynamic-pagination-pages">\
                    <span class="dynamic-pagination-link-topage-template" data-goto-page="0">\
                        <span style="display:none;">\
                            <strong></strong>\
                        </span>\
                        <a href=""></a>\
                    </span>\
                </div>\
                <div class="dynamic-right dynamic-pagination-browse">\
                    <div class="dynamic-left dynamic-pagination-link-left" style="display:none;">\
                        <a href="">\
                            <span class="dynamic-icon"></span> \
                            {% sitewording "widget:list_inquiries:pagination:recent_page" %}\
                        </a>\
                    </div>\
                    <div class="dynamic-right dynamic-pagination-link-right" style="display:none;">\
                        <a href="?page=2" data-goto-page="2">\
                            {% sitewording "widget:list_inquiries:pagination:next_page" %} \
                            <span class="dynamic-icon"></span>\
                        </a>\
                    </div>\
		    <div class="dynamic-right dynamic-pagination-link-seperator">|</div>\
                    <div class="clearer">&nbsp;</div>\
                </div>\
		<div class="clearer">&nbsp;</div>\
        </div>');
                    
                    if (this.$footer.html() == "") {
                        this.$footer.remove();
                    }
                },
                
                get_zoomEntry_handler: function($this){
                    return function(event, attr_name, attr_value){
                        var $widget = $this.element;
                        $widget.find('.dynamic-list-entry:not([data-' + attr_name + '="' + attr_value + '"])').slideUp();
                        $widget.find('.dynamic-pagination').slideUp();
                    }
                },
                
                get_removeEntry_handler: function($this){
                    return function(event, attr_name, attr_value){
                        var $widget = $this.element;
                        $widget.find('.dynamic-list-entry[data-' + attr_name + '="' + attr_value + '"]').remove();
                        $widget.data(attr_name, undefined);
                        $this.reload();                        
                    }
                },
                
                get_unzoomEntry_handler: function($this){
                    return function(event, attr_name, attr_value){
                        var $widget = $this.element;
                        $widget.find('.dynamic-list-entry:not([data-' + attr_name + '="' + attr_value + '"])').slideDown();
                        $widget.find('.dynamic-pagination').slideDown();
                    }
                },
                
                get_lastPage: function(){
                    if (this.element.find('.dynamic-pagination-link-topage:last').size()) {
                        return this.element.find('.dynamic-pagination-link-topage:last').attr("data-goto-page")
                    }
                    return 1 // no pages at all
                    
                },
                
                get_clickOnPaginationLink_handler: function($this){
                    return function(event){
                        event.stopImmediatePropagation();
                        event.preventDefault();
                    
                        $this.goToPage($(event.target).attr('data-goto-page'), $(event.target).attr('data-filter-letter'));
                        
                        return false;
                    }
                },
                
                goToPage: function(page, letter){
                    var page_nr = parseInt(page);
                    
                    this.element.data('current_page', page);
                    this.element.data('current_letter', letter)
                        
                    this.options.loadPage(
                                            {page: page_nr, letter: letter},
                                            this.get_showList_handler(this, page_nr, letter)
                    );
                },
                
                get_reload_handler: function($this){
                    return $this.reload;
                },
                
                reload: function(event){
                    if (event) {
                        event.stopImmediatePropagation();
                    }
                    
                    this.goToPage(this.element.data('current_page'), this.element.data('current_letter'));
                },
            
                pagination_showLeft: function(number_left, letter){
                    this.element.find('.dynamic-pagination-link-left').show()
                    this.element.find('.dynamic-pagination-link-left').find(
                        'a'
                        ).attr(
                               'data-goto-page', number_left
                        ).attr(
                               'data-filter-letter', letter
                        ).attr(
                               'href', '?'+(letter?('letter='+letter+'&'):'')+'page='+number_left
                        );
                    this.element.find('.dynamic-pagination-link-right').hide()
                    this.element.find('.dynamic-pagination-link-seperator').hide()
                },
                
                pagination_showRight: function(number_right, letter){
                    this.element.find('.dynamic-pagination-link-left').hide()
                    this.element.find('.dynamic-pagination-link-right').show()
                    this.element.find('.dynamic-pagination-link-right').find(
                        'a'
                        ).attr(
                               'data-goto-page', number_right
                        ).attr(
                               'data-filter-letter', letter
                        ).attr(
                               'href','?'+(letter?('letter='+letter+'&'):'')+'page='+number_right
                        );
                    this.element.find('.dynamic-pagination-link-seperator').hide()
                },
                
                pagination_showNone: function(){
                    this.element.find('.dynamic-pagination-link-left').hide()
                    this.element.find('.dynamic-pagination-link-right').hide()
                    this.element.find('.dynamic-pagination-link-seperator').hide()
                },
                
                pagination_showBoth: function(number_right, number_left, letter){
                    this.element.find('.dynamic-pagination-link-left').show()
                    this.element.find('.dynamic-pagination-link-left').find(
                        'a'
                        ).attr(
                               'data-goto-page', number_left
                        ).attr(
                               'data-filter-letter', letter
                        ).attr(
                               'href', '?'+(letter?('letter='+letter+'&'):'')+'page='+number_left
                        );
                    this.element.find('.dynamic-pagination-link-right').show()
                    this.element.find('.dynamic-pagination-link-right').find(
                        'a'
                        ).attr(
                               'data-goto-page', number_right
                        ).attr(
                               'data-filter-letter', letter
                        ).attr(
                               'href', '?'+(letter?('letter='+letter+'&'):'')+'page='+number_right
                        );
                    this.element.find('.dynamic-pagination-link-seperator').show()
                },
                
                buildEntry: function(elem, content){
                },
                
                /*scheduleContentFilling: function($entry_container, elem){
                    // todo: delete. not used
                    function fill_content(data, status, jqXHR){
                        $entry_container.html(data)
                        //update_bindings($entry_container)
                        $entry_container.children().show_inquiry({load_content:false})
                    }
                    var data = {};
                    data[this.options.entry_kwarg]=elem;
                    this.element.triggerHandler('dynamic-start-loading');
                    this.options.entry_entpoint.get({
                        url: this.options.entry_url,
                        done: fill_content,
                        data: data,
                        fail: dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:list_inquiries:action:load_inquiry_content" %}', this),
                    })
                },*/
                
                get_showList_handler: function($this, page, letter){
                    return function(data){
                        
                        $this.element.find('.dynamic-list-container').find('.dynamic-list-entry').each(function(index, elem){
                            var $elem = $(elem);
                            var content = $elem.html();//.get(0);
                            //content = content.outerHTML || new XMLSerializer().serializeToString(content);
                            $this.element.data('entry-' + $elem.attr('data-dynamic-list-entry-id'), content);
                            $elem.remove();
                        })
                        var output = [];
                        $.each(data, function(index, elem){
                            elem_id = $this.options.getIdForEntry(elem);
                            var curOutput = '<div class="dynamic-list-entry" data-dynamic-list-entry-id="'+elem_id+'">';
                            
                            if ($this.element.data('entry-' + elem_id) != undefined) {
                                curOutput += $this.element.data('entry-' + elem_id);
                            }
                            
                            curOutput += '</div>'
                            output.push(curOutput);
                        });
                        var $container = $this.element.find('.dynamic-list-container');
                        $container.prepend(output.join(""));
                        $.each(data, function(index, elem){
                            elem_id = $this.options.getIdForEntry(elem);
                            var entry = $container.find('.dynamic-list-entry[data-dynamic-list-entry-id="'+ elem_id +'"]');
                            
                            $this.options.fillEntry(elem, entry)
                        });
                        
                        var last_page = $this.options.getLastPageNumber();
                        
                        $this.updatePagination(page, last_page, letter);
                        $this.element.triggerHandler('dynamic-end-loading');
                    };
                },
                    
                
                updatePagination: function(number, numbers, letter){                    
                    // create / delete the links as needed for maximum possible pages
                    var $number = this.element.find('.dynamic-pagination-link-topage-template');
                    var output = new Array();
                    if (this.options.pagination_asPages) {                    
                        var number_tmp = 1;
                        var $number_tmp = this.element.find('.dynamic-pagination-link-topage[data-goto-page="'+number_tmp+'"]');
                        while (number_tmp <= numbers || $number_tmp.get(0) != undefined){
                            if (number_tmp > numbers){
                                $number_tmp.hide();
                            }else if ($number_tmp.get(0) != undefined){
                                $number_tmp.show();
                            }else{
                                $number.clone().insertBefore($number).after(" ");
                                var insert = this.element.find('.dynamic-pagination-link-topage-template[data-goto-page="0"]:first');
                                insert.attr('data-goto-page', number_tmp).find('a').attr('href', '?page='+number_tmp).attr('data-goto-page', number_tmp).html(number_tmp);
                                insert.find('span>strong').html(number_tmp);
                                insert.show();
                                insert.addClass('dynamic-pagination-link-topage').removeClass('dynamic-pagination-link-topage-template');
                                //alert(insert);
                            }
                            number_tmp += 1;
                            $number_tmp = this.element.find('.dynamic-pagination-link-topage[data-goto-page="'+number_tmp+'"]');
                        }
                        
                        if (numbers > 10){
                            var number_tmp=4;
                            while (number_tmp < numbers-3){
                                var $number_tmp = this.element.find('.dynamic-pagination-link-topage[data-goto-page="'+number_tmp+'"]');
                                if ((number_tmp < 4) || (number_tmp > numbers -4) || ((number_tmp > number - 3) && (number_tmp < number + 3))){
                                    $number_tmp.show()
                                }else{
                                    $number_tmp.hide()
                                    if (number_tmp == number -3 || number_tmp == number + 3 ){
                                        $number_tmp.before('<span class="dynamic-pagination-link-topage-seperator"> . . . </span>');
                                    }
                                }
                                number_tmp += 1;
                            }
                        }
                        var $numbers = this.element.find('.dynamic-pagination-link-topage');
                        $numbers.find('span').hide()
                        $numbers.find('a').show()
                
                        var $number = this.element.find('.dynamic-pagination-link-topage[data-goto-page="'+number+'"]');
                        $number.find('span').show()
                        $number.find('a').hide()
                        
                    }else if (this.options.pagination_asAlphabet) {
                        
                        // styling needs 'undefined' to be string
                        // further processing needs the undefined object instead
                        if (letter == undefined) {
                            letter = 'undefined'
                        }
                        
                        var list_alphabet = ['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                        var number_tmp = 1;
                        var $this = this;
                        $.each(list_alphabet, function(index, elem){
                            var $letter_tmp = $this.element.find('.dynamic-pagination-link-topage[data-filter-letter="'+((elem!=list_alphabet[0])?elem:'undefined')+'"]');
                            if ($letter_tmp.get(0) != undefined){
                                $letter_tmp.show();
                            }else{
                                $number.clone().insertBefore($number).after(" ");
                                var insert = $this.element.find('.dynamic-pagination-link-topage-template[data-goto-page="0"]:first');
                                insert.attr(
                                            'data-goto-page', number_tmp
                                        ).attr(
                                               'data-filter-letter', (elem!=list_alphabet[0])?elem:'undefined'
                                        ).find(
                                        'a'
                                        ).attr(
                                               'href', '?'+((elem!=list_alphabet[0])?('letter='+elem+'&'):'')+'page='+number_tmp
                                        ).attr(
                                               'data-goto-page', number_tmp
                                        ).attr(
                                               'data-filter-letter', (elem!=list_alphabet[0])?elem:'undefined'
                                        ).html(elem);
                                insert.find('span>strong').html(elem);
                                insert.show();
                                insert.addClass('dynamic-pagination-link-topage').removeClass('dynamic-pagination-link-topage-template');
                                //alert(insert);
                            }
                        });
                        var $numbers = this.element.find('.dynamic-pagination-link-topage');
                        $numbers.find('span').hide()
                        $numbers.find('a').show()
                
                        var $number = this.element.find('.dynamic-pagination-link-topage[data-filter-letter="'+letter+'"]');
                        $number.find('span').show()
                        $number.find('a').hide()
                    }
                    
                    
                    // styling needs 'undefined' to be string
                    // further processing needs the undefined object instead
                    if (letter == 'undefined') {
                        letter = undefined
                    }
                    
                    this.element.find('.dynamic-pagination a').off('.dynamic-pagination');
                    this.element.find('.dynamic-pagination a').on('click.dynamic-widget.dynamic-list.dynamic-pagination', this.get_clickOnPaginationLink_handler(this))
                    
                    // show as for current page
                    this.element.find('.dynamic-pagination-link-topage-seperator').remove();
                    
            
                    if (number == 1 && numbers > number){
                        this.pagination_showRight(number+1);
                    }else if (number == numbers && numbers > 1){
                        this.pagination_showLeft(number-1);
                    }else if (numbers == 1){
                        this.pagination_showNone();
                    }else{
                        this.pagination_showBoth(number+1, number-1);
                    }
                },
        });
        
        
        $.widget( "dynamic_widgets.dynamic_form",{
                options:{
                    resetOn_postSave: true
                },
                
                _create: function() {
                    
                    if (! this.element.hasClass('dynamic-form')) {
                        throw new Error('the target for "dynamic_widgets.form" widget needs to have a "dynamic-form" class');
                    }
                    
                    this.init_inputs();
                    
                    this.element.on('dynamic-pre-save.dynamic-form', this.get_preSave_handler(this));
                    this.element.on('dynamic-post-save.dynamic-form', this.get_postSave_handler(this));
                    this.element.find('.dynamic-save').on('click.dynamic-form', this.get_checkBeforeSave_handler(this));
                    this.element.on('dynamic-initiate-save.dynamic-form', this.get_checkBeforeSave_handler(this));
                    this.element.on('dynamic-save-failed.dynamic-form', this.get_submitFailed_handler(this));
                    this.element.on('dynamic-notification.dynamic-widget.dynamic-form', dynamic_widgets.get_notification_handler(this));
                    this.element.on('dynamic-errors.dynamic-widget.dynamic-form', this.get_error_handler(this));
                    
                },
                
                get_error_handler: function($this){
                    return function(event, action, error_data, jqXHR){
                        if (jqXHR && jqXHR.status == 400) {
                            $.each(error_data, function(index, err){
                                $this.element.find('input, textarea, select').each(function(index, elem){
                                    var $elem = $(elem);
                                    if (err[$elem.attr("data-backend-attr")]) {
                                        event.stopImmediatePropagation();
                                        var msg = err[$elem.attr("data-backend-attr")];
                                        $elem.addClass("dynamic-invalid");
                                        alert(msg);
                                        $elem.removeClass("dynamic-invalid");
                                    }
                                }); 
                            })
                            if (event.isImmediatePropagationStopped()) {
                                $this.element.closest('.dynamic-widget').triggerHandler('dynamic-end-loading');
                            }
                            
                        }
                    }
                },
                
                get_checkBeforeSave_handler: function($this){
                    return function(event){
                        // no form submit shall be handled
                        event.preventDefault();
                        
                        // no customer specific, global, handlers should be alarmed
                        event.stopPropagation();
                        
                        var $form = $this.element;
                        
                        // do pre_save actions
                        $form.triggerHandler('dynamic-pre-save')
                        
                        // this is filled with data by form_validation mehtods
                        var check_form_result = {
                            form_is_valid: true,
                            errors: new Array(),
                            warnings: new Array()
                            };
                        
                        // handlerResult is undefined if no handler was executed
                        // might be helpfull if this someday is relevant
                        var handlerResult = $form.triggerHandler('dynamic-check-input', [check_form_result])
                        
                        var fakeXHR = {status: 400} // Bad Request: HTTP 400
                        
                        if (check_form_result.form_is_valid){
                                $form.trigger('dynamic-save');
                            }else{
                                if (handlerResult != undefined) {
                                    if (check_form_result.errors.length)
                                        $form.trigger(
                                            'dynamic-errors', [
                                                '{% sitewording_js "widget:new_inquiry:action:input:validation" %}',
                                                check_form_result.errors,
                                                fakeXHR
                                            ]
                                        );
                                    if (check_form_result.warnings.length)
                                        $form.trigger(
                                            'dynamic-warnings', [
                                                '{% sitewording_js "widget:new_inquiry:action:input:validation" %}',
                                                check_form_result.warnings,
                                                fakeXHR
                                            ]
                                        );  
                                }else{
                                    if (check_form_result.errors.length)
                                        $form.trigger(
                                            'dynamic-errors', [
                                                '{% sitewording_js "widget:new_inquiry:action:input:validation" %}',
                                                new Array({
                                                    'elem': $form,
                                                    'msg': '{% sitewording_js "widget:new_inquiry:action:input:validation:not_existing" %}'
                                                }),
                                                fakeXHR
                                            ]
                                        );
                                }
                                
                                $form.triggerHandler('dynamic-save-failed');
                            };
                    };
                },
                
                get_inputFocus_handler: function($this){
                    return function(event){
                        var $input = $(event.target);
                        event.stopPropagation();
                        
                        if($input.val() == $input.attr('data-descriptive-value')){
                            $input.val('');
                        }
                        $input.removeClass("dynamic-descriptive");
                    };
                },
                
                get_inputBlur_handler: function($this){
                    return function(event){
                        var $input = $(event.target);
                        event.stopPropagation();
                        
                        if(!$input.val()){
                            $input.val($input.attr('data-descriptive-value'));
                            $input.addClass("dynamic-descriptive");
                        }
                    };
                },
                
                get_preSave_handler: function($this){
                    return function(event){
                        var $form = $this.element;
                        
                        // deactivate save button
                        $this.deactivate_formButtons();
                        
                        // reset default values
                        $.each($form.find('input, textarea'), function(index, elem){
                            var $elem = $(elem);
                            if ($elem.attr('data-descriptive-value') == $elem.val()){
                                $elem.val('');
                            }
                        });
                    };
                },
                
                init_inputs: function(){
                    var $form = this.element;
                    var $this = this
                    
                    // reset default values
                    $.each($form.find('input, textarea, select'), function(index, elem){
                        var $elem = $(elem);
                        
                        if ($elem.attr('data-descriptive-value') != undefined){
                            if (!$elem.val()) {
                                // set value
                                $elem.val($elem.attr('data-descriptive-value'));
                                $elem.addClass("dynamic-descriptive");
                            }
                            
                            // set handlers
                            $elem.off('.dynamic-form-descriptive-value');
                            
                            $elem.on('focus.dynamic-form-descriptive-value', $this.get_inputFocus_handler($this));
                            $elem.on('blur.dynamic-form-descriptive-value', $this.get_inputBlur_handler($this));
                        }
                    });                    
                },
                
                get_postSave_handler: function($this){
                    return function(event){     
                        var $form = $this.element;
                        
                        if ($this.option('resetOn_postSave'))
                            $this.reset()
                        
                        $this.init_inputs()
                        
                        // activate save button
                        $this.activate_formButtons();
                    };
                },
                
                reset: function(){
                    
                    this.element.each(function(index, form){
                        var $form = $(form);
                        $form.get(0).reset();
                    });
                    
                },
                
                get_submitFailed_handler: function($this){
                    return function(event){
                        var $form = $this.element;
                        
                        // activate save button
                        $this.activate_formButtons();
                    }
                },
                
                deactivate_formButtons: function(){                    
                    var $save_button =  this.element.find('.dynamic-save');
                    $save_button.prop("disabled", true);
                    $save_button.addClass("deactivated");
                },
                
                activate_formButtons: function(){                    
                    var $save_button =  this.element.find('.dynamic-save');
                    $save_button.prop("disabled", false);
                    $save_button.removeClass("deactivated");
                }
            
            
        });
        
        
    });
    
    return $;
});