import * as React from "react";
import * as Types from "../types";

declare function Header(
    props: {
        as?: React.ElementType;
        borderBottom?: Types.Visibility.VisibilityConditions;
    }
): React.JSX.Element