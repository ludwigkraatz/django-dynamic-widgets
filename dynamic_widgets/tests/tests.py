"""
Force import of all modules in this package in order to get the standard test
runner to pick up the tests.  Yowzers.
"""
import os

modules = [filename.rsplit('.', 1)[0]
           for filename in os.listdir(os.path.dirname(__file__))
           if not filename.endswith('.py') and not filename.endswith('.pyc') and not filename=='']
__test__ = dict()

for module in modules:
    if not module: continue
    try:
        exec("from dynamic_widgets.tests.%s.tests import *" % module)
    except ImportError, e:
        print 'error importing test package "%s": "%s"' % (module, e)