import * as React from "react";
import * as Types from "../types";

declare function Accordion(
    props: {
        as?: React.ElementType;
        title?: React.ReactNode;
        text?: Types.Basic.RichTextChildren;
    }
): React.JSX.Element