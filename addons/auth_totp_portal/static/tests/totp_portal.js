import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";

registry.category("web_tour.tours").add('totorbex_tour_setup', {
    url: '/my/security',
    steps: () => [{
    content: "Open totp wizard",
    trigger: 'button#auth_totp_orbex_enable',
    run: "click",
}, {
    content: "Check that we have to enter enhanced security mode",
    trigger: ".modal div:contains(enter your password)",
}, {
    content: "Input password",
    trigger: '[name=password]',
    run: "edit orbex", // FIXME: better way to do this?
}, {
    content: "Confirm",
    trigger: "button:contains(Confirm Password)",
    run: "click",
}, {
    content: "Check the wizard has opened",
    trigger: '.o_auth_totp_enable_2FA',
}, {
    content: "Get secret from collapsed div",
    trigger: 'a:contains("Cannot scan it?")',
},
{
    trigger: `span[name="secret"]:hidden`,
    async run(helpers) {
        const secret = this.anchor.textContent;
        const token = await rpc("/totphook", {
            secret,
            offset: 0,
        });
        await helpers.edit(token, 'input[name="code"]');
    }
}, {
    trigger: "button.btn-primary:contains(Activate)",
    run: "click",
    expectUnloadPage: true,
}, {
    content: "Check that the button has changed",
    trigger: 'button:contains(Disable two-factor authentication)',
}]});

registry.category("web_tour.tours").add('totorbex_login_enabled', {
    url: '/',
    steps: () => [{
    content: "check that we're on the login page or go to it",
    isActive: ["body:not(:has(input#login))"],
    trigger: "a:contains(Sign in)",
    run: "click",
    expectUnloadPage: true,
}, {
    content: "input login",
    trigger: 'input#login',
    run: "edit orbex",
}, {
    content: 'input password',
    trigger: 'input#password',
    run: "edit orbex",
}, {
    content: "click da button",
    trigger: 'button:contains("Log in")',
    run: "click",
    expectUnloadPage: true,
}, {
    content: "expect totp screen",
    trigger: 'label:contains(Authentication Code)',
    run: "click",
}, {
    content: "input code",
    trigger: 'input[name=totp_token]',
    run: async function (helpers) {
        const token = await rpc('/totphook', { offset: 1 });
        await helpers.edit(token);
    }
}, {
    trigger: "button:contains(Log in)",
    run: "click",
    expectUnloadPage: true,
}, {
    content: "check we're logged in",
    trigger: "h3:contains(My account)",
}, {
    content: "go back to security",
    trigger: "a:contains(Security)",
    run: "click",
    expectUnloadPage: true,
},{
    content: "Open totp wizard",
    trigger: 'button#auth_totp_orbex_disable',
    run: "click",
}, {
    content: "Check that we have to enter enhanced security mode",
    trigger: ".modal div:contains(enter your password)",
}, {
    content: "Input password",
    trigger: '[name=password]',
    run: "edit orbex",
}, {
    content: "Confirm",
    trigger: "button:contains(Confirm Password)",
    run: "click",
    expectUnloadPage: true,
}, {
    content: "Check that the button has changed",
    trigger: 'button:contains(Enable two-factor authentication)',
}]});

registry.category("web_tour.tours").add('totorbex_login_disabled', {
    url: '/',
    steps: () => [{
    content: "check that we're on the login page or go to it",
    isActive: ["body:not(:has(input#login))"],
    trigger: "a:contains(Sign in)",
    run: "click",
    expectUnloadPage: true,
}, {
    content: "input login",
    trigger: 'input#login',
    run: "edit orbex",
}, {
    content: 'input password',
    trigger: 'input#password',
    run: "edit orbex",
}, {
    content: "click da button",
    trigger: 'button:contains("Log in")',
    run: "click",
    expectUnloadPage: true,
}, {
    content: "check we're logged in",
    trigger: "h3:contains(My account)",
}]});
