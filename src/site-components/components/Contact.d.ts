import * as React from "react";
import * as Types from "../types";

declare function Contact(
    props: {
        as?: React.ElementType;
        link?: Types.Basic.Link;
        image?: Types.Asset.Image;
        navbarMenuItemText?: React.ReactNode;
        navbarMenuItemLink?: Types.Basic.Link;
        navbarMenuItem2Text?: React.ReactNode;
        navbarMenuItem2Link?: Types.Basic.Link;
        navbarMenuItem3Text?: React.ReactNode;
        navbarMenuItem3Link?: Types.Basic.Link;
        navbarMenuItem4Text?: React.ReactNode;
        navbarMenuItem4Link?: Types.Basic.Link;
        buttonTextText?: React.ReactNode;
        buttonTextLink?: Types.Basic.Link;
    }
): React.JSX.Element