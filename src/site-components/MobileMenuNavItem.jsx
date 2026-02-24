"use client";
import React from "react";
import * as _Builtin from "./_Builtin";

export function MobileMenuNavItem(
    {
        as: _Component = _Builtin.Link,
        text = "Menu Item",
        link
    }
) {
    return (
        <_Component
            className="mobile-menu-nav-item"
            button={false}
            block="inline"
            options={link}><_Builtin.Block className="menu-nav-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="menu-nav-icon-wrapper" tag="div"><_Builtin.HtmlEmbed
                    className="menu-nav-icon"
                    value="%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2218%22%20height%3D%2218%22%20fill%3D%22currentColor%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M220.24%2C132.24l-72%2C72a6%2C6%2C0%2C0%2C1-8.48-8.48L201.51%2C134H40a6%2C6%2C0%2C0%2C1%2C0-12H201.51L139.76%2C60.24a6%2C6%2C0%2C0%2C1%2C8.48-8.48l72%2C72A6%2C6%2C0%2C0%2C1%2C220.24%2C132.24Z%22%2F%3E%3C%2Fsvg%3E" /></_Builtin.Block></_Component>
    );
}