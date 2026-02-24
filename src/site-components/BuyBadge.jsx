"use client";
import React from "react";
import * as _Builtin from "./_Builtin";

export function BuyBadge(
    {
        as: _Component = _Builtin.Link
    }
) {
    return (
        <_Component
            className="buy-badge"
            button={false}
            block="inline"
            options={{
                href: "http://gola.io/kajo",
                target: "_blank"
            }}><_Builtin.Image
                loading="lazy"
                width="22"
                height="Auto"
                alt="Webflow Icon"
                src="https://cdn.prod.website-files.com/699c654868800a6c4e63cf11/699c654968800a6c4e63cfd4_buy-badge-webflow-icon.svg" /><_Builtin.Block className="buy-badge-text" tag="div">{"Get FREE Template"}</_Builtin.Block></_Component>
    );
}