"use client";
import React from "react";
import * as _Builtin from "../_Builtin";

export function FooterSmall(
    {
        as: _Component = _Builtin.Block
    }
) {
    return (
        <_Component className="footer-small" tag="footer"><_Builtin.Block className="padding-global" tag="div"><_Builtin.Block className="container-small" tag="div"><_Builtin.Block className="margin-bottom margin-small" tag="div"><_Builtin.Image
                            loading="lazy"
                            width="auto"
                            height="Auto"
                            alt="Logo"
                            src="https://cdn.prod.website-files.com/699c654868800a6c4e63cf11/699c654968800a6c4e63d1a6_logo.svg" /></_Builtin.Block><_Builtin.Block className="text-size-small text-color-muted" tag="div">{"© Made by "}<_Builtin.Link
                            className="text-style-link"
                            button={false}
                            block=""
                            options={{
                                href: "#",
                                target: "_blank"
                            }}>{"Gola Templates"}</_Builtin.Link>{". Powered by "}<_Builtin.Link
                            className="text-style-link"
                            button={false}
                            block=""
                            options={{
                                href: "#",
                                target: "_blank"
                            }}>{"Webflow"}</_Builtin.Link>{"."}</_Builtin.Block></_Builtin.Block></_Builtin.Block></_Component>
    );
}