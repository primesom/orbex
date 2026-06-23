import { Component } from "@orbex/owl";

export class OverlayButtons extends Component {
    static template = "html_builder.OverlayButtons";
    static props = {
        state: { type: Object },
    };

    setup() {
        this.state = this.props.state;
    }
}
