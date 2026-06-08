import { browser } from "../browser/browser";
import { Dialog } from "../dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { registry } from "../registry";
import { Tooltip } from "@web/core/tooltip/tooltip";
import { usePopover } from "@web/core/popover/popover_hook";
import { useService } from "@web/core/utils/hooks";
import { capitalize } from "../utils/strings";

import { Component, useRef, useState, markup } from "@orbex/owl";

const { DateTime } = luxon;

// This props are added by the error handler
export const standardErrorDialogProps = {
    traceback: { type: [String, { value: null }], optional: true },
    message: { type: String, optional: true },
    name: { type: String, optional: true },
    exceptionName: { type: [String, { value: null }], optional: true },
    data: { type: [Object, { value: null }], optional: true },
    subType: { type: [String, { value: null }], optional: true },
    code: { type: [Number, String, { value: null }], optional: true },
    type: { type: [String, { value: null }], optional: true },
    serverHost: { type: [String, { value: null }], optional: true },
    id: { type: [Number, { value: null }], optional: true },
    model: { type: [String, { value: null }], optional: true },
    close: Function, // prop added by the Dialog service
};

export const orbexExceptionTitleMap = new Map(
    Object.entries({
        "orbex.addons.base.models.ir_mail_server.MailDeliveryException": _t("MailDeliveryException"),
        "orbex.exceptions.AccessDenied": _t("Access Denied"),
        "orbex.exceptions.MissingError": _t("Missing Record"),
        "orbex.addons.web.controllers.action.MissingActionError": _t("Missing Action"),
        "orbex.addons.base.models.ir_actions.ServerActionWithWarningsError": _t("Invalid Operation"),
        "orbex.exceptions.UserError": _t("Invalid Operation"),
        "orbex.exceptions.ValidationError": _t("Validation Error"),
        "orbex.exceptions.AccessError": _t("Access Error"),
        "orbex.exceptions.Warning": _t("Warning"),
    })
);

// -----------------------------------------------------------------------------
// Generic Error Dialog
// -----------------------------------------------------------------------------
export class ErrorDialog extends Component {
    static template = "web.ErrorDialog";
    static components = { Dialog };
    static title = _t("Orbex Error");
    static showTracebackButtonText = _t("See technical details");
    static hideTracebackButtonText = _t("Hide technical details");
    static props = { ...standardErrorDialogProps };

    setup() {
        this.state = useState({
            showTraceback: false,
        });
        this.copyButtonRef = useRef("copyButton");
        this.popover = usePopover(Tooltip);
        this.contextDetails = "Occured ";
        if (this.props.serverHost) {
            this.contextDetails += `on ${this.props.serverHost} `;
        }
        if (this.props.model) {
            this.contextDetails += `on model ${this.props.model} `;
        }
        this.contextDetails += `on ${DateTime.now()
            .setZone("UTC")
            .toFormat("yyyy-MM-dd HH:mm:ss")} GMT`;
    }

    showTooltip() {
        this.popover.open(this.copyButtonRef.el, { tooltip: _t("Copied") });
        browser.setTimeout(this.popover.close, 800);
    }

    onClickClipboard() {
        browser.navigator.clipboard.writeText(
            `${this.props.name}\n\n${this.props.message}\n\n${this.contextDetails}\n\n${this.props.traceback}`
        );
        this.showTooltip();
    }
}

// -----------------------------------------------------------------------------
// Client Error Dialog
// -----------------------------------------------------------------------------
export class ClientErrorDialog extends ErrorDialog {}
ClientErrorDialog.title = _t("Orbex Client Error");

// -----------------------------------------------------------------------------
// Network Error Dialog
// -----------------------------------------------------------------------------
export class NetworkErrorDialog extends ErrorDialog {}
NetworkErrorDialog.title = _t("Orbex Network Error");

// -----------------------------------------------------------------------------
// Request Entity Too Large Dialog
// -----------------------------------------------------------------------------
export class RequestEntityTooLargeErrorDialog extends ErrorDialog {}
RequestEntityTooLargeErrorDialog.title = _t("The request sent to the server was too large");

// -----------------------------------------------------------------------------
// RPC Error Dialog
// -----------------------------------------------------------------------------
export class RPCErrorDialog extends ErrorDialog {
    setup() {
        super.setup();
        this.inferTitle();
        this.traceback = this.props.traceback;
        if (this.props.data && this.props.data.debug) {
            this.traceback = `${this.props.data.debug}\nThe above server error caused the following client error:\n${this.traceback}`;
        }
    }
    inferTitle() {
        // If the server provides an exception name that we have in a registry.
        if (this.props.exceptionName && orbexExceptionTitleMap.has(this.props.exceptionName)) {
            this.title = orbexExceptionTitleMap.get(this.props.exceptionName).toString();
            return;
        }
        // Fall back to a name based on the error type.
        if (!this.props.type) {
            return;
        }
        switch (this.props.type) {
            case "server":
                this.title = _t("Orbex Server Error");
                break;
            case "script":
                this.title = _t("Orbex Client Error");
                break;
            case "network":
                this.title = _t("Orbex Network Error");
                break;
        }
    }

    onClickClipboard() {
        browser.navigator.clipboard.writeText(
            `${this.props.name}\n\n${this.props.message}\n\n${this.contextDetails}\n\n${this.traceback}`
        );
        this.showTooltip();
    }
}

// -----------------------------------------------------------------------------
// Warning Dialog
// -----------------------------------------------------------------------------
export class WarningDialog extends Component {
    static template = "web.WarningDialog";
    static components = { Dialog };
    static props = {
        ...standardErrorDialogProps,
        title: { type: String, optional: true },
    };

    setup() {
        this.title = this.inferTitle();
        const { data, message } = this.props;
        if (data && data.arguments && data.arguments.length > 0) {
            this.message = data.arguments[0];
        } else {
            this.message = message;
        }
    }
    inferTitle() {
        if (this.props.exceptionName && orbexExceptionTitleMap.has(this.props.exceptionName)) {
            return orbexExceptionTitleMap.get(this.props.exceptionName).toString();
        }
        return this.props.title || _t("Orbex Warning");
    }
}

// -----------------------------------------------------------------------------
// Redirect Warning Dialog
// -----------------------------------------------------------------------------
export class RedirectWarningDialog extends Component {
    static template = "web.RedirectWarningDialog";
    static components = { Dialog };
    static props = { ...standardErrorDialogProps };

    setup() {
        this.actionService = useService("action");
        const { data, subType } = this.props;
        const [message, actionId, buttonText, additionalContext] = data.arguments;
        this.title = capitalize(subType) || _t("Orbex Warning");
        this.message = message;
        this.actionId = actionId;
        this.buttonText = buttonText;
        this.additionalContext = additionalContext;
    }
    async onClick() {
        const options = { forceLeave: true };
        if (this.additionalContext) {
            options.additionalContext = this.additionalContext;
        }
        if (this.actionId.help) {
            this.actionId.help = markup(this.actionId.help);
        }
        await this.actionService.doAction(this.actionId, options);
        this.props.close();
    }
}

// -----------------------------------------------------------------------------
// Error 504 Dialog
// -----------------------------------------------------------------------------
export class Error504Dialog extends Component {
    static template = "web.Error504Dialog";
    static components = { Dialog };
    static props = { ...standardErrorDialogProps };
}

// -----------------------------------------------------------------------------
// Expired Session Error Dialog
// -----------------------------------------------------------------------------
export class SessionExpiredDialog extends Component {
    static template = "web.SessionExpiredDialog";
    static components = { Dialog };
    static props = { ...standardErrorDialogProps };

    onClick() {
        browser.location.reload();
    }
}

registry
    .category("error_dialogs")
    .add("orbex.exceptions.AccessDenied", WarningDialog)
    .add("orbex.exceptions.AccessError", WarningDialog)
    .add("orbex.exceptions.MissingError", WarningDialog)
    .add("orbex.addons.web.controllers.action.MissingActionError", WarningDialog)
    .add("orbex.addons.base.models.ir_actions.ServerActionWithWarningsError", WarningDialog)
    .add("orbex.exceptions.UserError", WarningDialog)
    .add("orbex.exceptions.ValidationError", WarningDialog)
    .add("orbex.exceptions.RedirectWarning", RedirectWarningDialog)
    .add("orbex.http.SessionExpiredException", SessionExpiredDialog)
    .add("werkzeug.exceptions.Forbidden", SessionExpiredDialog)
    .add("504", Error504Dialog);
