import * as React from "react";
import * as Types from "../types";

declare function ButtonMuted(
    props: {
        as?: React.ElementType;
        text?: React.ReactNode;
        link?: Types.Basic.Link;
    }
): React.JSX.Element