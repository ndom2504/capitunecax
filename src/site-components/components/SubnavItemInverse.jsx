"use client";
import React from "react";
import * as _Builtin from "../_Builtin";

export function SubnavItemInverse(
    {
        as: _Component = _Builtin.Link,
        text = "Item",
        link
    }
) {
    return (
        <_Component
            className="subnav-item inverse"
            button={false}
            block="inline"
            options={link}><_Builtin.Block className="subnav-item-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="subnav-item-line inverse" tag="div" /></_Component>
    );
}