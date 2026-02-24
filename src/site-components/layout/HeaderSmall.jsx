"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import { Contact } from "../components/Contact";

export function HeaderSmall(
    {
        as: _Component = _Builtin.Block
    }
) {
    return <_Component className="header-small" tag="header"><Contact /></_Component>;
}