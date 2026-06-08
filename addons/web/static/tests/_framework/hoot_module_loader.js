// @orbex-module ignore
// ! WARNING: this module must be loaded after `module_loader` but cannot have dependencies !

(function (orbex) {
    "use strict";

    if (orbex.define.name.endsWith("(hoot)")) {
        return;
    }

    const name = `${orbex.define.name} (hoot)`;
    orbex.define = {
        [name](name, dependencies, factory) {
            return orbex.loader.define(name, dependencies, factory, !name.endsWith(".hoot"));
        },
    }[name];
})(globalThis.orbex);
