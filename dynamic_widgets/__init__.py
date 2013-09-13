def get_content_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__DYNAMIC_CONTENT_MODEL', None) is not None
    
    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__DYNAMIC_CONTENT_MODEL', 'dynamic_widgets.DynamicContent').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__DYNAMIC_CONTENT_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__DYNAMIC_CONTENT_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.dynamic_content import DynamicContent as model
    return model

"""
def get_menu_model():
    from django.conf import settings
    from django.db.models.loading import get_model
    
    return get_model(*getattr(settings, 'DYNAMIC_WIDGETS__MENU_MODEL', 'dynamic_widgets.Menu').split('.'))
"""

def get_menu_entry_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__MENU_ENTRY_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__MENU_ENTRY_MODEL', 'dynamic_widgets.MenuEntry').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__MENU_ENTRY_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__MENU_ENTRY_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.menu import MenuEntry as model
    return model


def get_js_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__JS_CODE_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__JS_CODE_MODEL', 'dynamic_widgets.JavaScriptCode').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__JS_CODE_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__JS_CODE_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.templates import JavaScriptCode as model
    return model


def get_css_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__CSS_CODE_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__CSS_CODE_MODEL', 'dynamic_widgets.CSSCode').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__CSS_CODE_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__CSS_CODE_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.templates import CSSCode as model
    return model


def get_django_template_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__DJANGO_TEMPLATE_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__DJANGO_TEMPLATE_MODEL', 'dynamic_widgets.DjangoTemplate').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__DJANGO_TEMPLATE_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__DJANGO_TEMPLATE_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.templates import DjangoTemplate as model
    return model
  

def get_widget_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__WIDGET_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__WIDGET_MODEL', 'dynamic_widgets.Widget').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__WIDGET_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__WIDGET_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.widgets import Widget as model
    return model
  

def get_context_model():
    from django.conf import settings
    from django.db.models import get_model
    from django.core.exceptions import ImproperlyConfigured
    
    has_setting = getattr(settings, 'DYNAMIC_WIDGETS__CONTEXT_MODEL', None) is not None

    try:
        app_label, model_name = getattr(settings, 'DYNAMIC_WIDGETS__CONTEXT_MODEL', 'dynamic_widgets.WidgetContext').split('.')
    except ValueError:
        raise ImproperlyConfigured("DYNAMIC_WIDGETS__CONTEXT_MODEL must be of the form 'app_label.model_name'")
    model = get_model(app_label, model_name)
    if model is None:
        if has_setting:
            raise ImproperlyConfigured("DYNAMIC_WIDGETS__CONTEXT_MODEL refers to model '%s.%s' that has not been installed" % (app_label, model_name))
        else:
            from dynamic_widgets.models.templates import WidgetContext as model
    return model
