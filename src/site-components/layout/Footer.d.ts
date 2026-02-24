import * as React from "react";
import * as Types from "../types";

declare function Footer(
    props: {
        as?: React.ElementType;
        borderTopVisibility?: Types.Visibility.VisibilityConditions;
    }
): React.JSX.Element