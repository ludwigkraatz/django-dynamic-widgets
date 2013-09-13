define(['core-widgets'], function($){
    $(function() {
        
        function insertAtCaret(areaId, text) {
            var txtarea = document.getElementById(areaId);
            var scrollPos = txtarea.scrollTop;
            var strPos = 0;
            var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
                "ff" : (document.selection ? "ie" : false ) );
            if (br == "ie") { 
                txtarea.focus();
                var range = document.selection.createRange();
                range.moveStart ('character', -txtarea.value.length);
                strPos = range.text.length;
            }
            else if (br == "ff") strPos = txtarea.selectionStart;
        
            var front = (txtarea.value).substring(0,strPos);  
            var back = (txtarea.value).substring(strPos,txtarea.value.length); 
            txtarea.value=front+text+back;
            strPos = strPos + text.length;
            if (br == "ie") { 
                txtarea.focus();
                var range = document.selection.createRange();
                range.moveStart ('character', -txtarea.value.length);
                range.moveStart ('character', strPos);
                range.moveEnd ('character', 0);
                range.select();
            }
            else if (br == "ff") {
                txtarea.selectionStart = strPos;
                txtarea.selectionEnd = strPos;
                txtarea.focus();
            }
            txtarea.scrollTop = scrollPos;
        };
        
        
        $.widget( "dynamic_widgets.dynamic_wording_editor",{
            
                _create: function(){
                    this.context = {
                        parentLanguages: {},
                        siteLanguages: []
                    }
                    var $this = this;
                    this.elements = {};
                    this.listedWordings = [];
                    
                    this.elements.list = this.element.find('.list');
                    this.elements.list.dynamic_lookup_list({
                        
                        lookupObject:       dynamic_widgets.get('wordings'),                        
                        getContentForHeader: function(result, domHeader){
                                                var language_code = domHeader.attr('data-id');
                                                if (language_code === undefined) {
                                                    return result.request.data['identifier']
                                                }
                                                var wordings = result.getObject().__objects;
                                                for (var entry in wordings) {
                                                    var wording = wordings[entry];
                                                    var wordingData = wording.__onLoad();
                                                    if (wordingData.language == language_code) {
                                                        return wording.asForm('content');
                                                    }
                                                }
                                                return 'empty';
                        },
                        getIdForEntry: function(source){
                            return source.identifier
                        }
                    })
                    
                                    
                                    
                    dynamic_widgets.all('languages', {},
                                        function(result){                        
                                            var output = [];
                                            if (result.wasSuccessfull) {
                                                var languages = result.getContent();
                                                
                                                $.each(languages, function(index, elem){
                                                         $this.context.siteLanguages.push(elem.code);
                                                         $this.context.parentLanguages[elem.code] = elem.parent;
                                                         var header = '<div data-id="'+elem.id+'" data-code="'+elem.code+'">' + (elem.name || elem.code) + '</div>';
                                                        $this.elements.list.dynamic_list('addHeader', header)
                                                       });
                                            }
                                }
                                //fail':dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:init:action:get_languages" %}'),
                    );
                },
            
                registerTemplateSource: function(domInput){
                    var $this = this;
                    this.elements.templateSource = $(domInput);
                    this.elements.templateSource.on('change.dynamic_wording_editor', function(){
                        $this.updateWordingList($this.elements.templateSource.val());
                    })
                },
                 
                
                updateWordingList: function(code){
                    var output = [];
                    
                    wording_expr = /*{% verbatim %}*//{%[ ]*(?:sitewording|sitewording_js|sitewording_attr) ['"]*([a-zA-Z0-9:/\\-_?= ]*)['"]*(?:[\\ a-zA-Z_]*)%}/g;/*{% endverbatim %}*/
                    var listedWordings = [];
                    this.listedWordings = [];
                    
                    while (wording = wording_expr.exec(code)){
                        if (listedWordings.indexOf(wording[1]) == -1){
                            
                            listedWordings.push(wording[1]);
                            this.listedWordings.push({
                                                        identifier: wording[1]
                                                    });
                        }
                    }
                    
                    this.listedWordings.sort();
                    
                    this.elements.list.dynamic_lookup_list('setSource', this.listedWordings);
                    
                },
                
                get_wordingEntry: function(wording_identifier){
                    
                    //this.elements.wordingEditor.find('tr.table_entry').remove();
                    //this.elements.wordingEditor.find('table>tbody').append(output.join(''));
                           //listed_wordings.push(wording[1]);
                           //output.push(this.get_wordingEntry(wording[1]));
                           
                           
                    // todo set Cache-Control: no-cache
                    var $this = this;
                    dynamic_widgets.get({
                        "url": 'wordings/',//?identifier='+wording_identifier,
                        "data": {
                            identifier: wording_identifier
                        },
                        "done": function(response, text, jqXHR){
                            
                            var unused_languages = $this.context.siteLanguages.slice(0);
                            
                            $.each(response, function(index, element){
                                found_at=unused_languages.indexOf(element.language);
                                
                                if (found_at > -1){
                                    wording_elem = $('.wording_element[data-wording=\''+wording_identifier+'\'][data-language=\''+element.language+'\']')
                                    wording_elem.attr('data-uuid', element.id)
                                    wording_elem.html('<span class="wording_entry">'+(element.content ? element.content : '__nothin__')+'</span>');
                                    unused_languages.splice(found_at,1);
                                    $('.wording_element[data-wording=\''+wording_identifier+'\'][data-language=\''+element.language+'\']>span.wording_entry').on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', $this.get_editWording_handler($this));
                                }
                            });
                            
                            $.each(unused_languages, function(index, elem){
                                if ($this.context.parentLanguages[elem]){
                                    $('.wording_element[data-wording=\''+wording_identifier+'\'][data-language=\''+elem+'\']').html('<span class="wording_entry_add">__inherited__</span>');
                                }else{
                                    $('.wording_element[data-wording=\''+wording_identifier+'\'][data-language=\''+elem+'\']').html('<span class="wording_entry_add">__empty__</span>');
                                }
                                $('.wording_element[data-wording=\''+wording_identifier+'\'][data-language=\''+elem+'\']>span.wording_entry_add').on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', $this.get_addWording_handler($this));
                            });
                            
                        }
                            
                    });
                    
                    var ret = '<tr class="table_entry"><td>'+wording_identifier+'</td>'
                    
                    $.each(this.context.siteLanguages, function(index, element){
                        ret += '<td><span class="wording_element" data-wording="'+wording_identifier+'" data-language="'+element+'"></span></td>';
                    });
                    
                    return ret + '</tr>'
                },
                
        });
        
        $.widget( "dynamic_widgets.dynamic_content_editor",{
            
                _create: function(){
                    this.elements = {};
                    this.elements.dynamicContentContainer = this.element.find('.dynamic-content-container');
                    this.element.data('listed_contend', []);
                },
            
                registerTemplateSource: function(domInput){
                    var $this = this;
                    this.elements.templateSource = $(domInput);
                    this.elements.templateSource.on('change.dynamic_content_editor', function(){
                        $this.update_dynamicContent($this.elements.templateSource.val());
                    })
                },
                
                addContent: function(dynContentIdentifier){
                    ret = '';
                    
                    var dynContent = dynamic_widgets.get('contents');
                    
                    dynContent.all({identifier: dynContentIdentifier}, function(result){
                        
                        if (result.wasSuccessfull) {
                            var dynamicContent = result.getContent();
                            console.log(dynamicContent);
                            
                            ret += '<div data-identifier="'+ dynContentIdentifier +'">';
                            
                            for (var content in dynamicContent) {
                                
                                ret += content.asForm('content_identifier', 'position', 'content', 'condition');
                            }
                            
                            ret += '</div>'
                    
                            this.elements.dynamicContentContainer.append(ret);
                        }
                        
                        
                    }, true)
                    
                },                
                
                update_dynamicContent: function(code){
                    var $this = this;
                    var output = [];
                    
                    this.elements.dynamicContentContainer.empty();
                    this.element.data('listed_contend', [])
                     
                    dyn_content_expr = /*{% verbatim %}*//{%[ ]* (?:dynamic_content|dynamic_content_seperated) ['"]*([a-zA-Z0-9:/\\-_?= ]*)['"]*(?:[\\ a-zA-Z_]*)%}/g;/*{% endverbatim %}*/
                    var listed_contents = this.element.data('listed_contend');
                    
                    while (dyn_content = dyn_content_expr.exec(code)){                        
                        if (listed_contents.indexOf(dyn_content[1]) == -1){
                            
                           listed_contents.push(dyn_content[1]);
                           
                           this.addContent(dyn_content[1]);
                           //output.push($this.get_dynamicContentBlock(dyn_content[1]));
                        }
                    }
                    /*
                    if (output.length > 0){
                        
                        this.elements.dynamicContentEditor.append('<div class="accordion">' + output.join('') + '</div>');
                        this.elements.dynamicContentEditor.find('div.accordion').accordion({heightStyle: "content"})
                        
                        $(".add_dynamic_content").click(function(event){
                            $this.addDynamicContent($(event.target).attr('data-dynamic-content-identifier'));
                        });
                        
                        $.each(listed_contents, function(index, elem){
                            $this.update_dynamicContentBlocks(elem)
                        });
                    }*/
                },
        });
        
        $.widget( "dynamic_widgets.dynamic_template_editor",{
                options:{
                    wordingEditor: undefined,
                    dynamicContentEditor: undefined,
                },
            
                _create: function(){
                    this.elements = {};
                    
                    this.elements.templateEditorWindow = this.element.find('#template_editor_window');
                    this.elements.templateForm = this.element.children('form').first();
                    this.elements.templateSource = this.elements.templateForm.find(':input[name="content"]');
                    
                    if (this.options.wordingEditor) {
                        this.options.wordingEditor.dynamic_wording_editor('registerTemplateSource', this.elements.templateSource);
                    }
                    if (this.options.dynamicContentEditor) {
                        this.options.dynamicContentEditor.dynamic_content_editor('registerTemplateSource', this.elements.templateSource);
                    }
                    
                },
                
                get_saveEditorContent_handler: function($this){
                    return function(){
                        
                        active_editing_area = $this.set_activeEditingArea($(event.target).closest(".editing-area"));
                        var code = active_editing_area.find('.editor_window').val();
                        
                        if ($this.testCode(code)){
                            var save_btn = active_editing_area.find('.save_editor_content');
                            active_editing_area.find('.release_editor_content').hide()
                            active_editing_area.find('.save_editor_content').hide()
                            
                            var widget_uuid = active_editing_area.attr('data-widget');
                            if (active_editing_area.hasClass('template_editor')){
                                var url =  '/templates/django/versions/';
                                var data =  {
                                    "content": code,
                                    "identifier":  active_editing_area.find('.template_identifier').val(),
                                    "orig_uuid": active_editing_area.attr('data-orig-uuid'),
                                  };
                                var func = $this.get_loadTemplateFromResponse_handler($this);
                            }else if (active_editing_area.hasClass('dyn_content_editor')){
                                var url = 'dynamic_content/';
                                var data =  {
                                    "content": code,
                                    "identifier":  active_editing_area.find('.identifier').val(),
                                    "position":  active_editing_area.find('.position').val(),
                                    "condition":  active_editing_area.find('.condition').val(),
                                    "content_identifier":  active_editing_area.attr('data-dynamic-content-identifier'),
                                    "orig_uuid": active_editing_area.attr('data-orig-uuid'),
                                  };
                                var func = $this.get_updateDynamicContentEditorWindow_handler($this);
                            }else{
                                alert('{% sitewording "widget:widgeteditor:error:editing_window_not_recognized" %}');
                                throw Error("Editing window not recognized");
                            }
                            
                            dynamic_widgets.ajax.post({
                                "url": url,
                                "dataType": "json",
                                "data":data,
                                "done": function(data, textStatus, jqXHR){
                                  (func)(data);
                                  (save_btn).show()
                                 },
                                 "fail": function(a, b, c){
                                  dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:save_editor_content" %}')(a, b, c);
                                  (save_btn).show();
                                 }
                             })
                        }
                    }
                },
                
                get_releaseEditorContent_handler: function($this){
                    return function(event){
                        
                        active_editing_area = $this.set_activeEditingArea($(event.target).closest(".editing-area"));
                        
                        active_editing_area.find('.release_editor_content').hide()
                        active_editing_area.find('.save_editor_content').hide()
                        var save_btn = active_editing_area.find('.save_editor_content');
                        
                        if (active_editing_area.hasClass('template_editor')){
                            var url = 'templates/django/' + $('.active-editing-area .editor_window').attr('data-uuid') + '/'
                        }else if (active_editing_area.hasClass('dyn_content_editor')){
                            var url = 'dynamic_content/' + $('.active-editing-area .editor_window').attr('data-uuid') + '/'
                        }else{
                            alert('{% sitewording "widget:widgeteditor:error:editing_window_not_recognized" %}');
                            throw Error("Editing window not recognized");
                        }
                        
                        dynamic_widgets.ajax.put({
                            "url": url,
                            "dataType": "json",
                            "data": {
                               "action":'release',
                            },
                            "done": function(data, textStatus, jqXHR){
                              (save_btn).show()
                            },
                            "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:release_editor_content" %}')
                        })
                    }
                },
                
                
                testCode: function(code){
                    successful = true;
                    // test for script tag
                    script_tag_expr = /*{% verbatim %}*//<[ ]*script[ ]*>/g;/*{% endverbatim %}*/
                    
                    if (match = script_tag_expr.exec(code)){
                        alert('{% sitewording_js "widget:widgeteditor:error:script_tag_found" %}'+ '\n' + match[0])
                        successful = false;
                    }
            
                    // test for javascript code without CDATA formatting
                    javascript_expr = /*{% verbatim %}*//<script type="text\/javascript">[ ]*([/ <![CDTA]*)/g;/*{% endverbatim %}*/
                    
                    while(match = javascript_expr.exec(code)){
                        if (match[1] != '// <![CDATA['){
                            alert('{% sitewording_js "widget:widgeteditor:error:js_without_cdata_formatting_found" %}'+ '\n' + match[0])
                            successful = false;
                         }
                    }
            
                    // test for javascript code without CDATA formatting
                    javascript_expr = /*{% verbatim %}*//[ ]*([/ \]>]*)[ ]*<[ ]*\/[ ]*script[ ]*>/g;/*{% endverbatim %}*/
                    
                    while(match = javascript_expr.exec(code)){
                        if (match[1] != '// ]]>'){
                            alert('{% sitewording_js "widget:widgeteditor:error:js_without_cdata_formatting_found" %}'+ '\n' + match[0])
                            successful = false;
                         }
                    }
            
                    
                    // test for old wording tags
                    old_wording_expr = /*{% verbatim %}*//{%[ ]* wording ['"]*([a-zA-Z0-9:/\\-_?= ]*)['"]*(?:[\\ a-zA-Z_]*)%}/g;/*{% endverbatim %}*/
                    
                    if (match = old_wording_expr.exec(code)){
                        alert('{% sitewording_js "widget:widgeteditor:error:old_wording_schema_found" %}'+ '\n' + match[0])
                        successful = false;
                    }
                    return successful
                },
                
                closeTemplate: function(){
                    var oldTemplate = this.element.data('template');
                    this.element.data('template', null);
                    
                    if (oldTemplate && oldTemplate.hasUnsavedChanges() && !confirm('{% sitewording_js "widget:widgeteditor:continue_without_saving" %}')) {
                        return false
                    }                    
                    if (oldTemplate) {
                        oldTemplate.disconnect(this.elements.templateForm);
                    };
                    
                    return true;
                },
                
                updateTemplate: function(template){
                    var $this = this;
                    if (this.closeTemplate()){
                        template.load(function(result){
                            if (result.wasSuccessfull) {
                                console.log('x')
                                template.connect(this.elements.templateForm, this.get_connectTemplateCallback()); 
                            }else if (result.statusText == 'NOT FOUND') {
                                $this.notFound(result);
                            }else{
                                console.log(result)
                            }
                        })
                        
                    }
                },
                
                notFound: function(result){                    
                    if (confirm('{% sitewording_js "widget:widgeteditor:continue_without_saving" %}')) {
                        template = result.getObject();
                        template.create(function(result){
                            $this.updateTemplate(result.getObject());
                        });
                        /*dynamic_widgets.get('templates').create({
                                identifier: 
                            }, function(result){
                            $this.updateTemplate(result.getObject());
                        })*/
                    }
                },
                
                get_connectTemplateCallback: function(){
                    var $this = this;
                    return function(result){
                            
                            if (result.wasSuccessfull){
                                $this.element.data('template', result);
                            }else if (result.statusText == 'not found'){                                
                                $this.notFound(result);
                            }
                        }
                    
                }
        });
        
        $.widget( "dynamic_widgets.dynamic_widget_editor",{
                options: {
                    width: '100%',
                    load_content: true
                },
                
                _create: function() {
                    
                    this.context = {
                        parentLanguages: {},
                        siteLanguages: new Array()
                    }
                    this.elements = {}
                    
                    
                    this.element.on('dynamic-init-widget.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_init_handler(this));
                    
                    this.element.dynamic_widget({
                        widget_url: 'widget-editor',
                    });
                },
                
                init_editorElements: function(){
                    this.elements.addNewWidget_button = this.element.find('#add_new_widget')
                    this.elements.WidgetSelect = this.element.find('#WidgetSelect')
                    this.elements.activeEditingArea = null;
                    
                    this.elements.wordingEditor = this.element.find('.dynamic-widget[data-widget-name="dynamic-wording-editor"]');
                    this.elements.wordingEditor.dynamic_wording_editor()
                    
                    this.elements.dynamicContentEditor = this.element.find('.dynamic-widget[data-widget-name="dynamic-content-editor"]');
                    this.elements.dynamicContentEditor.dynamic_content_editor()
                    
                    this.elements.templateEditor = this.element.find('.dynamic-widget[data-widget-name="dynamic-template-editor"]');
                    this.elements.templateEditor.dynamic_template_editor({
                        wordingEditor: this.elements.wordingEditor,
                        dynamicContentEditor: this.elements.dynamicContentEditor
                        });
                },
                
                update_editorElements: function(){
                    this.elements.textareas = this.element.find('.editing-area textarea');
                    this.elements.saveEditor_button = this.element.find('.save_editor_content');
                    this.elements.releaseContent_button = this.element.find('.release_editor_content');
                    this.elements.releaseWordings_button = this.element.find('.release_wordings');
                    
                    //this.elements.templateEditor = this.element.find('#template-editor');
                },
                
                get_init_handler: function($this){
                    return function(event){                       
                        
                        var obj = $(event.target).data('_object');
                        /**/
                        obj.prepare([{
                            target: 'content',
                            format: 'html',
                            callback: function(result){//.get('content')
                                
                                if (result.wasSuccessfull){
                                    html = result.getContent();
                                    
                                    $this.element.empty().html(html); // IE9 needs empty(): http://api.jquery.com/html/
                                                            
                                    $this.element.find( ".widget-editor-menu" ).tabs();
                                    
                                    $this.init_editorElements();  
                                    
                                    $this.update_editingAreas();
                                    
                                    $this.elements.addNewWidget_button.click($this.get_addNewWidget_handler($this));                    
                                    
                                    $('#WidgetSelect').on('change.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', function(){
                                        var WidgetSelect = $(this);
                                        var cur_widget = WidgetSelect.val();
                                        if (cur_widget){
                                            var template = dynamic_widgets.get('templates').get('template', cur_widget);
                                            if ($this.elements.templateEditor.dynamic_template_editor('updateTemplate', template)){
                                                WidgetSelect.data('current', cur_widget);
                                                return true;
                                            }else{
                                                WidgetSelect.val(WidgetSelect.data('current'))
                                                return false;
                                            }
                                            /*
                                                dynamic_widgets.get('templates').prepare({
                                                    target: 'template',
                                                    data  : {'template': cur_widget},
                                                    wrapped: true,
                                                    done: function(template){
                                                            $this.elements.templateEditor.dynamic_template_editor('updateTemplate', template);
                                                            //$this.get_loadTemplateFromResponse_handler($this)(response)
                                                        }
                                                });  
                                            */
                                        }else{
                                            if ($this.elements.templateEditor.dynamic_template_editor('closeTemplate')){
                                                WidgetSelect.data('current', cur_widget);
                                                return true;
                                            }else{
                                                WidgetSelect.val(WidgetSelect.data('current'));
                                                return false;
                                            }
                                        };
                                    });
                                    
                                    $(window).keypress(function(event) {
                                        if (
                                            !(event.which == 115 && event.ctrlKey) && // CTRL+S on Win
                                            !(event.which == 115 && event.metaKey) && // CMD+S on Mac
                                            !(event.which == 19)) return true; // CTRL+S == 19
                                        active_editing_area = $this.get_activeEditingArea();
                                        active_editing_area.find('.save_editor_content').click();
                                        event.preventDefault();
                                        return false;
                                    });
                                    
                                    $this.update_widgetSelector();
                                }else{
                                    // todo
                                }
                                
                            }
                        }]);
                    }                    
                },
                
                update_widgetSelector: function(callback){
                    var $this = this;
                    widgets = dynamic_widgets.get('widgets');
                    widgets.refresh(function(result){
                        
                        if (result.wasSuccessfull) {
                            widgets = result.getContent();
                            
                            var output = [];
                            output.push('<option value>{% sitewording "widget:widgeteditor:select_widget" %}</option>');
                            $.each(widgets, function(index, elem){
                              output.push('<option value="'+ elem.identifier +'">'+ elem.endpoint_name +'</option>');
                            });
                  
                            $this.elements.WidgetSelect.html(output.join(''));
                            
                            if (callback instanceof Function) {
                                callback(widgets);
                            }   
                        }
                        
                    });
                },
                
                update_editingAreas: function(){
                    
                    // unbind current bound
                    if (this.elements.textareas != undefined) {
                        this.elements.textareas.off('input.dynamic-wording-editor');
                        this.elements.textareas.off('propertychange.dynamic-wording-editor');
                        this.elements.textareas.off('focus.dynamic-wording-editor');
                        this.elements.textareas.off('blur.dynamic-wording-editor');
                        this.elements.textareas.off('keydown.dynamic-wording-editor'); 
                    }
                    if (this.elements.saveEditor_button != undefined) {
                        this.elements.saveEditor_button.off('click.dynamic-wording-editor');
                    }
                    if (this.elements.releaseContent_button != undefined) {
                        this.elements.releaseContent_button.off('click.dynamic-wording-editor');
                    }
                    if (this.elements.releaseWordings_button != undefined) {
                        this.elements.releaseWordings_button.off("click.dynamic-wording-editor");
                    }
                    // update this.elements
                    this.update_editorElements();                  
                    
                    // update bindings
                    this.elements.textareas.on('input.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor propertychange.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_hideReleaseBtn_handler(this));
                    this.elements.textareas.on('focus.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_setActiveEditingArea_handler(this));              
                    this.elements.textareas.on('blur.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_unsetActiveEditingArea_handler(this));            
                    this.elements.textareas.on('keydown.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_editorWindowKeyPressed_handler(this));                
                    //this.elements.saveEditor_button.on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_saveEditorContent_handler(this));        
                    //this.elements.releaseContent_button.on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_releaseEditorContent_handler(this));
                    this.elements.releaseWordings_button.on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', this.get_releaseWordings_handler(this));
                },
                
                update_tabsFromCode: function(code){
                    this.update_dynamicContent(code);
                },
                
                get_dynamicContentBlock: function(dyn_content_identifier){
                    var ret =  '<h3>' + dyn_content_identifier + '</h3>';
                    ret += '<div id="dyn_content"  data-dynamic-content-identifier="' + dyn_content_identifier + '">';
                    ret += '<br /><br /><input type="button" value="Add" class="add_dynamic_content" data-dynamic-content-identifier="' + dyn_content_identifier +'"/>';
                    ret += ' </div>';
                    return ret
                },
                
                get_dynamicContentEditor: function(data){
                    ret = '<div class="editing-area dyn_content_editor" data-orig-uuid="'+ data.orig_uuid+ '" data-dynamic-content-identifier="'+ data.content_identifier+ '" data-identifier="'+ data.identifier+ '">';
                    ret += '<br /><textarea data-uuid="'+ data.id+ '" class="editor_window" id="editor_window_dyn_content__' +data.content_identifier.replace(":", "_") +'__'+ data.identifier+ '">';
                    ret += data.content
                    ret += '</textarea><br />';
                    ret += '<div style="float:left;">';
                    ret += '<input type="text" value="' + data.identifier + '" class="identifier">';
                    ret += '<input type="text" value="' + (data.position ? data.position:'0') + '" class="position">';
                    ret += '<input type="text" value="' +( data.condition ? data.condition:'')+ '" class="condition">';
                    ret += '</div>';
                    ret += '<div style="float:right;">';
                    ret += '<input type="button" value="release" class="release_editor_content" style="display:none;"> ';
                    ret += '<input type="button" value="save (CTRL+S)" class="save_editor_content">';
                    ret += '</div>';
                    ret += '<div style="display: block;font-size: 0;line-height: 0;height: 0;clear: both;">&nbsp;</div>';
                    ret += '</div>';
                    return ret
                },
                
                update_dynamicContentBlocks: function(dyn_content_identifier){
                    var $this = this;
                    dynamic_widgets.get({
                        "url": 'dynamic_content/',//?content_identifier='+dyn_content_identifier,
                        "data": {
                            content_identifier: dyn_content_identifier
                        },
                        "dataType": "json",
                        "done": function(data, textStatus, jqXHR){
                            $.each(data, function(index, elem){
                                dynamic_widgets.ajax.get({
                                    "url": 'dynamic_content/orig/'+ elem.id + '/',
                                    "dataType": "json",
                                    "done": function(data, textStatus, jqXHR){
                                        var dyn_content_div = $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"]')
                                        
                                        dyn_content_div.prepend($this.get_dynamicContentEditor(data))
                                        
                                        $this.update_editingAreas();
                                        $this.update_wordingList(data.content);
       
                                        if (! data.released){
                                            dyn_content_div.find('.editing-area[data-identifier="'+ data.identifier+'"] .release_editor_content').show()
                                        }else{
                                            dyn_content_div.find('.editing-area[data-identifier="'+ data.identifier+'"] .release_editor_content').hide()
                                        }
                                     },
                                     "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:receive_dynamic_content" %}')
                                 })
                            });
                         },
                         "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:update_dynamic_content_blocks" %}')
                     })
                },
                
                
                update_dependings: function(){
                    //dynamic_widgets.ajax.post('wordings/', { // todo: was @Êpublic before
                    //       "action": "release",
                    //   })
                },
                
                get_addWording_handler: function($this){
                    return function(event){
                        var $label = $(event.target)
                        var $wording_element = $label.parent();
                        var language =  $wording_element.attr('data-language');
                        var identifier =  $wording_element.attr('data-wording');
                        var wording = prompt('add: '+ identifier + ' in '+ language);
                        if (wording != undefined){
                           $label.html('__loading__')
                           dynamic_widgets.ajax.post({
                            "url": 'wordings/',
                            "data": {
                                "language": language,
                                "identifier": identifier,
                                "content": wording
                            },
                            "done": function(data, textStatus, jqXHR){
                                $wording_element.attr('data-uuid', data.id)
                                $label.html(data.content ? data.content : '__nothin__')
                                
                                /*$('.wording_element[wording="'+data.identifier+'"][language="'+data.language+'"]>span.wording_entry_add')*/
                                $label.off('click.dynamic-wording-editor');
                                /*$('.wording_element[wording="'+data.identifier+'"][language="'+data.language+'"]>span.wording_entry_add')*/
                                $label.addClass('wording_entry');
                                /*$('.wording_element[wording="'+data.identifier+'"][language="'+data.language+'"]>span.wording_entry_add')*/
                                $label.removeClass('wording_entry_add');
                                /*$('.wording_element[wording="'+data.identifier+'"][language="'+data.language+'"]>span.wording_entry')*/
                                $label.on('click.dynamic-widget.dynamic-staff-widget.dynamic-wording-editor', $this.get_editWording_handler($this));
                                
                                $this.update_dependings();
                            },
                            "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:add_wording" %}')
                             })
                        }
                    }
                },
                
                get_editWording_handler: function($this){
                    return function(event){
                        var $label = $(event.target)
                        var $wording_element = $label.parent();
                        var language = $wording_element.attr('data-language');
                        var identifier = $wording_element.attr('data-wording');
                        var uuid = $wording_element.attr('data-uuid');
                        var wording = prompt('edit: '+ identifier + ' in '+ language, $label.html());
                        if (wording != undefined){
                           $label.html('__loading__')
                           dynamic_widgets.ajax.put({
                                "url": "wordings/"+uuid+"/",
                                "dataType": "json",
                                "data": {
                                   "content": wording,
                                   "language": language,
                                   "identifier": identifier,
                                 },
                                "done": function(data, textStatus, jqXHR){
                                  $label.html(data.content ? data.content : '__nothin__')
                                  $this.update_dependings();
                                 },
                                 "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:edit_wording" %}')
                             })
                        }
                    }
                },
                
                get_unsetActiveEditingArea_handler: function($this){
                    return function(event){
                        $this.unset_activeEditingArea($(event.target).closest(".editing-area"));
                    }                    
                },
                
                get_setActiveEditingArea_handler: function($this){
                    return function(event){
                        $this.set_activeEditingArea($(event.target).closest(".editing-area"));
                    }
                },
                
                get_hideReleaseBtn_handler: function($this){
                    return function(event){
                        $(event.target).closest(".editing-area").find('.release_editor_content').hide();   
                    }
                },
                
                get_editorWindowKeyPressed_handler: function($this){
                    return function(e){
                        var keyCode = e.keyCode || e.which;
                  
                        if (keyCode == 9) { 
                            e.preventDefault(); 
                            insertAtCaret(event.target.getAttribute('id'), '    ');
                            return false;
                        }
                    };
                },
                
                get_updateDynamicContentEditorWindow_handler: function($this){
                    return function(data){
                        $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-orig-uuid="'+ data.orig_uuid+'"] .editor_window').val(data.content);
                        $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-orig-uuid="'+ data.orig_uuid+'"]').attr('data-identifier', data.identifier);
                        $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-orig-uuid="'+ data.orig_uuid+'"] .editor_window').attr('data-uuid', data.id);
                        $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-orig-uuid="'+ data.orig_uuid+'"] .editor_window').attr('id', 'editor_window_dyn_content__' +data.content_identifier.replace(":", "_") +'__'+ data.identifier);
    
                        if (! data.released){
                           $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-identifier="'+ data.identifier+'"] .release_editor_content').show()
                        }else{
                           $('#dyn_content[data-dynamic-content-identifier="' + data.content_identifier + '"] .editing-area[data-identifier="'+ data.identifier+'"] .release_editor_content').hide()
                        }
                    };
                },
                
                get_addNewWidget_handler: function($this){
                    return function(){
                        widgetCreator = dynamic_widgets.get('widgets').create({
                                'identifier': prompt('identifier'),
                                'endpoint_name': prompt('endpoint Name'),
                            }, function(widget){
                                widget.prepare('identifier',function(newWidgetData){
                                    $this.update_widgetSelector(function(widgets){
                                        for (var widgetData in widgets) {
                                            if (widgets[widgetData].identifier == newWidgetData.identifier){
                                                $this.elements.WidgetSelect.val(newWidgetData.identifier).change();
                                            }
                                        }                                    
                                    });
                                });
                        });
                    }
                    /*
                    return function(){
                        var widget_name = prompt('{% sitewording_js "widget:widgeteditor:add_widget:insert_widget_name" %}');
                        if (widget_name != undefined){                        
                            dynamic_widgets.ajax.post({
                                "url": 'templates/django/',
                                "dataType": "json",
                                "data": {
                                    "identifier": widget_name,
                                    "content": null
                                },
                                'done': function(data, textStatus, jqXHR){
                                    var uuid = data['id'];
                                    dynamic_widgets.ajax.post({
                                        "url": 'templates/django/',
                                        "dataType": "json",
                                        "data": {
                                                "identifier": widget_name,
                                                "content": "TODO",
                                                "orig_uuid": uuid
                                         },
                                        'done': function(data, textStatus, jqXHR){
                                            dynamic_widgets.ajax.post({
                                                "url": 'widgets/',
                                                "dataType": "json",
                                                "data": {
                                                    "identifier": widget_name,
                                                    "django_template": uuid,
                                                    "endpoint_url": widget_name,
                                                    "endpoint_name": widget_name
                                                 },
                                                'done': function(data, textStatus, jqXHR){
                                                    $this.update_widgetSelector();
                                                },
                                                'fail': dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:add_widget:action:create_widget" %}'),
                                            });
                                        },
                                        'fail': dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:add_widget:action:create_editor_version" %}'),
                                   })
                                },
                                'fail':dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:add_widget:action:create_template" %}')
                            })
                        }
                    }*/
                },
                
                
                get_activeEditingArea: function(){
                    
                    if (this.elements.activeEditingArea != null) {
                        return this.elements.activeEditingArea
                    }
                    
                    alert('{% sitewording "widget:widgeteditor:error:no_active_editing_area" %}');
                    throw Error("no active Editing Area selected");
                    //if ($('.active-editing-area').size() != 1){ alert('editor error'); return;}
                },
                
                set_activeEditingArea: function(editing_area){
                    
                    if (! editing_area.hasClass('editing-area')) {
                        throw Error("no valid element")
                    }
                    
                    this.unset_activeEditingArea();
                    
                    editing_area.addClass("active-editing-area");                    
                    this.elements.activeEditingArea = editing_area;
                        
                    return this.get_activeEditingArea();
                },
                
                unset_activeEditingArea: function(editing_area){   
                    
                    if (editing_area){
                        if (!editing_area.hasClass('editing-area')) {
                            throw Error("no valid element")
                        }else{
                            editing_area.removeClass("active-editing-area");
                        }
                    }else if (this.elements.activeEditingArea != null) {
                        old_area = this.get_activeEditingArea();
                        old_area.removeClass("active-editing-area");
                    }
                    
                    this.elements.activeEditingArea = null;
                },
                
                get_releaseWordings_handler: function($this){
                    return function(event){
                        var $release_btn = $(event.target);
                        
                        $release_btn.hide()
                        
                        dynamic_widgets.ajax.post({
                            "url": "wordings/",
                            "dataType": "json",
                            "data": {
                               "action":'release',
                            },
                            "done": function(data, textStatus, jqXHR){
                              ($release_btn).show()
                            },
                            "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:action:release_wordings" %}')
                        })
                    }
                },
                
                
                addDynamicContent: function(dyn_content_identifier){
                    var $this = this;
                    
                    var identifier = prompt('{% sitewording_js "widget:widgeteditor:add_dyn_content:insert_identifier" %}');
                    
                    if (identifier != undefined) {
                        dynamic_widgets.ajax.post({
                            "url": 'dynamic_content/',
                            "dataType": "json",
                            "data": {
                               "content":null,
                               "identifier":  identifier,
                               "content_identifier": dyn_content_identifier
                             },
                            "done": function(data, textStatus, jqXHR){
                                dynamic_widgets.ajax.post({
                                    "url": 'dynamic_content/',
                                    "dataType": "json",
                                    "data": {
                                       "content": 'TODO',
                                       "identifier":  identifier,
                                       "orig_uuid":  data.id,
                                       "content_identifier": dyn_content_identifier
                                     },
                                    "done": function(data, textStatus, jqXHR){
                                        $this.update_dynamicContentBlocks(dyn_content_identifier);
                                     },
                                     "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:add_dyn_content:action:create_content_version" %}')
                                });
                            },
                            "fail": dynamic_widgets.get_failed_xhr_handler('{% sitewording "widget:widgeteditor:add_dyn_content:action:create_content" %}')
                        })
                    };
                },
                
                
        });
        
    });
    
    return $;
});