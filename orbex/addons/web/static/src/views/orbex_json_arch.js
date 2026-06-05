function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function pythonValue(value) {
    if (value === "uid") {
        return "uid";
    }
    if (value === true) {
        return "True";
    }
    if (value === false || value === null) {
        return "False";
    }
    return JSON.stringify(value);
}

function conditionToExpression(condition) {
    const [field, operator, value] = condition;
    if (operator === "=") {
        if (value === false) {
            return `not ${field}`;
        }
        if (value === true) {
            return field;
        }
        return `${field} == ${pythonValue(value)}`;
    }
    if (operator === "!=") {
        if (value === false) {
            return field;
        }
        if (value === true) {
            return `not ${field}`;
        }
        return `${field} != ${pythonValue(value)}`;
    }
    throw new Error(`Unsupported Orbex JSON operator: ${operator}`);
}

function visibleToInvisible(visibleIf = []) {
    return `not (${visibleIf.map(conditionToExpression).join(" and ")})`;
}

function targetToXPath(target) {
    if (target === "search:root") {
        return "//search";
    }
    if (target?.startsWith("region:")) {
        return `//div[@name='${target.slice("region:".length)}']`;
    }
    if (target?.startsWith("xpath:")) {
        return target.slice("xpath:".length);
    }
    throw new Error(`Unsupported Orbex JSON target: ${target}`);
}

function nodeToXML(node) {
    if (node.type === "separator") {
        return "<separator/>";
    }
    if (node.type === "filter") {
        const attrs = [
            `name="${escapeAttribute(node.name)}"`,
            `string="${escapeAttribute(node.label || node.name)}"`,
        ];
        if (node.domain) {
            attrs.push(`domain="${escapeAttribute(JSON.stringify(node.domain))}"`);
        }
        return `<filter ${attrs.join(" ")}/>`;
    }
    if (node.type !== "template") {
        throw new Error(`Unsupported Orbex JSON node type: ${node.type}`);
    }

    const fields = node.fields || [];
    const buttons = node.buttons || [];
    const labelFor = fields[0] || "";
    const children = [
        `<div class="col-7 col-sm-6 col-lg-3 d-flex flex-column"><label class="o_form_label" for="${escapeAttribute(labelFor)}">${escapeAttribute(node.label || "Two-factor Authentication")}</label><span class="text-muted">${escapeAttribute(node.help || "Recommended for extra security.")}</span></div>`,
        ...fields.map((field) => `<field name="${escapeAttribute(field)}" invisible="1"/>`),
        ...buttons.map((button) => {
            const attrs = [
                `name="${escapeAttribute(button.name)}"`,
                `type="${escapeAttribute(button.type || "object")}"`,
                `class="${escapeAttribute(button.class || "btn btn-secondary")}"`,
                `string="${escapeAttribute(button.label || button.name)}"`,
            ];
            if (button.visible_if) {
                attrs.push(`invisible="${escapeAttribute(visibleToInvisible(button.visible_if))}"`);
            }
            return `<button ${attrs.join(" ")}/>`;
        }),
    ].join("");
    return `<div name="${escapeAttribute(node.name || "orbex_json_template")}" class="${escapeAttribute(node.class || "d-flex mt-3")}" data-orbex-template="${escapeAttribute(node.template || "")}">${children}</div>`;
}

export function compileOrbexJsonArch(archJson) {
    const patches = archJson?.patches || [];
    return patches
        .map((patch) => {
            const insert = Array.isArray(patch.insert) ? patch.insert : [patch.insert];
            return `<xpath expr="${escapeAttribute(targetToXPath(patch.target))}" position="${escapeAttribute(patch.position || "inside")}">${insert.filter(Boolean).map(nodeToXML).join("")}</xpath>`;
        })
        .join("");
}
