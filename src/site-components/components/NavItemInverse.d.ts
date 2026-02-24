import * as React from "react";
import * as Types from "../types";

declare function NavItemInverse(
    props: {
        as?: React.ElementType;
        text?: React.ReactNode;
        link?: Types.Basic.Link;
    }
): React.JSX.Element