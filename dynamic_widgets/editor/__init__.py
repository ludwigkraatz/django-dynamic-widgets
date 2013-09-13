from dynamic_widgets.models import Widget, DjangoTemplate

editor_widget = Widget(
    identifier      = 'widget-editor',
    
)
editor_template = DjangoTemplate(
    widget      = editor_widget,
    content     = """<div id='status'></div>
                Select Widget<select id='WidgetSelect' ></select> <input type='button' value='new'  id='add_new_widget'/><br />
                <div class="widget-editor-menu">
                  <ul>
                    <li><a href="#template-editor">Template Editor</a></li>
                    <li><a href="#dynamic_content">Dynamic Content</a></li>
                    <li><a href="#wordings">Wordings</a></li>
                    <li><a href="#preview">Preview</a></li>
                    <li><a href="#widget-settings">Settings</a></li>
                  </ul>
                  <div id='dynamic_content' class="dynamic-widget" data-widget-name="dynamic-content-editor">
                    <div class="dynamic-content-container"></div>
                  </div>
                  <div id='preview' class="dynamic-widget" data-widget-name="dynamic-template-preview"></div>
                  <div id="widget-settings">
                     <div id='widget_settings' style='display:none;'>
                         <input type='checkbox' id='is_widget_staff'><label for='is_widget_staff'>For Staff</label><br />
                         <input type='checkbox' id='is_widget_public'><label for='is_widget_public'>Public</label><br />
                    </div>
                  </div>
                  <div id='template-editor' class="dynamic-widget" data-widget-name="dynamic-template-editor">
                     <form>
                        <textarea name="content" id='template_editor_window' class="editor_window" style='height:450px;width:100%'></textarea>
                        <div style='float:left;'>
                            <input type='text' value='' name='identifier' class='template_identifier'/>
                        </div>
                        <div style='float:right;'>
                            <input type='button' value='release' class='release_editor_content' style='display:none;'/>
                            <input type='submit' value='save (CTRL+S)' class='save_editor_content'/>
                        </div><div style='display: block;font-size: 0;line-height: 0;height: 0;clear: both;'>&nbsp;</div>
                     </form>
                  </div>
                  <div id="wordings">
                     <div class="dynamic-widget" data-widget-name="dynamic-wording-editor">
                        <div class="list dynamic-list">
                            <div class="dynamic-header">
                                <div class="dynamic-list-entry-header" width=100>identifier</div>
                            </div>
                            <div class="dynamic-list-container"></div>
                        </div>
                     </div>
                     <input type="button" value="release" class="release_wordings">
                  </div>
                </div>""",
    
)