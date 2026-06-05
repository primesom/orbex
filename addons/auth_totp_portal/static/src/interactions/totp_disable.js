import { Interaction } from "@web/public/interaction";
import { registry } from "@web/core/registry";

import { handleCheckIdentity } from "@orbex/interactions/orbex_security";
import { user } from "@web/core/user";

export class TOTPDisable extends Interaction {
    static selector = "#auth_totp_orbex_disable";
    dynamicContent = {
        _root: { "t-on-click.prevent": this.onClick }
    }

    async onClick() {
        await this.waitFor(handleCheckIdentity(
            this.waitFor(this.services.orm.call("res.users", "action_totp_disable", [user.userId])),
            this.services.orm,
            this.services.dialog,
        ));
        location.reload();
    }
}

registry
    .category("public.interactions")
    .add("auth_totp_orbex.totp_disable", TOTPDisable);

