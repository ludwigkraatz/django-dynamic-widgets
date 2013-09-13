# TODO
# dynamic Content?
from dynamic_widgets.template_preprocessor import preprocess_tag
from dynamic_widgets.template_preprocessor.core.preprocessable_template_tags import NotPreprocessable

from dynamic_widgets import get_content_model
DynamicContent = get_content_model()

@preprocess_tag
def dynamic_content(*args):
    return ""
    if len(args) != 2:
        raise NotPreprocessable
    else:
        content_identifier = args[1]
        if content_identifier[0] == content_identifier[-1] and content_identifier[0] in ['"',"'"]:
            content_identifier = content_identifier[1:-1]
        content_list = (content.content for content in DynamicContent.objects.filter(content_identifier=content_identifier))
         # generator with view functions responses, that have been registered for specific content
        return "".join(content_list)