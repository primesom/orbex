/** @orbex-module **/

import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { FormController } from "@web/views/form/form_controller";
import { FormRenderer } from "@web/views/form/form_renderer";

const serviceRegistry = registry.category("services");
const LARGE_SCREEN_CHATTER_MIN_WIDTH = 1600;

function shouldUseBottomChatter() {
    return (
        user.settings?.chatter_position === "bottom" &&
        window.innerWidth < LARGE_SCREEN_CHATTER_MIN_WIDTH
    );
}

export const chatterPositionService = {
    start() {
        const classNameDescriptor = Object.getOwnPropertyDescriptor(
            FormController.prototype,
            "className"
        );
        if (classNameDescriptor?.get && !FormController.prototype.__orbexChatterClassPatched) {
            FormController.prototype.__orbexChatterClassPatched = true;
            Object.defineProperty(FormController.prototype, "className", {
                configurable: true,
                get() {
                    const result = { ...classNameDescriptor.get.call(this) };
                    if (shouldUseBottomChatter()) {
                        delete result["o_xxl_form_view h-100"];
                        result.o_orbex_bottom_chatter_form = true;
                    }
                    return result;
                },
            });
        }

        const originalMailLayout = FormRenderer.prototype.mailLayout;
        if (!originalMailLayout || FormRenderer.prototype.__orbexChatterPositionPatched) {
            return {};
        }
        FormRenderer.prototype.__orbexChatterPositionPatched = true;
        FormRenderer.prototype.mailLayout = function (...args) {
            const layout = originalMailLayout.call(this, ...args);
            if (!shouldUseBottomChatter()) {
                return layout;
            }
            if (layout === "SIDE_CHATTER") {
                return "BOTTOM_CHATTER";
            }
            if (layout === "EXTERNAL_COMBO_XXL") {
                return "EXTERNAL_COMBO";
            }
            return layout;
        };
        return {};
    },
};

serviceRegistry.add("orbex_chatter_position", chatterPositionService);
