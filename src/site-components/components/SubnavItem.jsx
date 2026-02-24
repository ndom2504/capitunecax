"use client";
import React from "react";
import * as _Builtin from "../_Builtin";

export function SubnavItem(
    {
        as: _Component = _Builtin.Link,
        text = "Item",
        link
    }
) {
    return <_Component className="subnav-item" button={false} block="inline" options={link}><_Builtin.Block className="subnav-item-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="subnav-item-line" tag="div" /></_Component>;
}