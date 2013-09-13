from django.shortcuts import render_to_response

def show_editor(request, *args, **kwargs):
    return render_to_response('dynamic_widgets/editor.html')
