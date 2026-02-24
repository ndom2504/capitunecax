"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import { NavbarMenuItem } from "../NavbarMenuItem";
import { ButtonText } from "./ButtonText";

export function Contact(
    {
        as: _Component = _Builtin.Block,

        link = {
            href: "#"
        },

        image = "https://cdn.prod.website-files.com/699c654868800a6c4e63cf11/699c7089ddc7a5c01b8cc164_ChatGPT%20Image%2020%20f%C3%A9vr.%202026%2C%2008%20h%2031%20min%2029%20s.png",
        navbarMenuItemText = "Accueil",

        navbarMenuItemLink = {
            href: "#"
        },

        navbarMenuItem2Text = "Services",

        navbarMenuItem2Link = {
            href: "#"
        },

        navbarMenuItem3Text = "Tarifs",

        navbarMenuItem3Link = {
            href: "#"
        },

        navbarMenuItem4Text = "À propos",

        navbarMenuItem4Link = {
            href: "#"
        },

        buttonTextText = "Let's Talk",

        buttonTextLink = {
            href: "#"
        }
    }
) {
    return (
        <_Component className="navbar-small" tag="address"><_Builtin.Block
                className="navbar-small-left"
                id="w-node-_21460138-8d00-13a0-6abe-29f15fac5c6e-5fac5c6d"
                tag="div"><_Builtin.Link className="navbar-logo" button={false} block="inline" options={link}><_Builtin.Image
                        className="navbar-logo-image"
                        width="95"
                        height="Auto"
                        loading="eager"
                        alt=""
                        src={image} /></_Builtin.Link></_Builtin.Block><_Builtin.Block
                className="navbar-small-right"
                id="w-node-_21460138-8d00-13a0-6abe-29f15fac5c71-5fac5c6d"
                tag="div"><_Builtin.Block className="navbar-small-menu" tag="nav"><NavbarMenuItem text={navbarMenuItemText} link={navbarMenuItemLink} /><NavbarMenuItem text={navbarMenuItem2Text} link={navbarMenuItem2Link} /><NavbarMenuItem text={navbarMenuItem3Text} link={navbarMenuItem3Link} /><NavbarMenuItem text={navbarMenuItem4Text} link={navbarMenuItem4Link} /></_Builtin.Block><ButtonText text={buttonTextText} link={buttonTextLink} /></_Builtin.Block></_Component>
    );
}