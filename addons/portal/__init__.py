# -*- coding: utf-8 -*-
# Part of orbex. See LICENSE file for full copyright and licensing details.

from orbex.tools.rendering_tools import template_env_globals
from orbex.http import request

template_env_globals.update({
    'slug': lambda value: request.env['ir.http']._slug(value)  # noqa: PLW0108
})

from . import controllers
from . import models
from . import utils
from . import wizard
