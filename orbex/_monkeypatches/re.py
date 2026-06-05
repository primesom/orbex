import re


def patch_module():
    """ Default is 512, a little too small for orbex """
    re._MAXCACHE = 4096
