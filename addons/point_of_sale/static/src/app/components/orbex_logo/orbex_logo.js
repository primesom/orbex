import { Component } from "@orbex/owl";

export class OrbexLogo extends Component {
    static template = "point_of_sale.OrbexLogo";
    static props = {
        class: { type: String, optional: true },
        style: { type: String, optional: true },
        monochrome: { type: Boolean, optional: true },
    };
    static defaultProps = {
        class: "",
        style: "",
        monochrome: false,
    };
}
