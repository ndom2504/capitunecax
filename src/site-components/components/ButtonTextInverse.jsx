"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-946":{"id":"e-946","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-255","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1101"}},"mediaQueries":["main"],"target":{"selector":".button-text","originalId":"bfd59f0a-26fe-a4c8-a486-b2077e50515b","appliesTo":"CLASS"},"targets":[{"selector":".button-text","originalId":"bfd59f0a-26fe-a4c8-a486-b2077e50515b","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1660580525284},"e-947":{"id":"e-947","name":"","animationType":"custom","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-256","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1892"}},"mediaQueries":["main"],"target":{"selector":".button-text","originalId":"bfd59f0a-26fe-a4c8-a486-b2077e50515b","appliesTo":"CLASS"},"targets":[{"selector":".button-text","originalId":"bfd59f0a-26fe-a4c8-a486-b2077e50515b","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1660580525286}},"actionLists":{"a-255":{"id":"a-255","title":"Button Text Hover [In]","actionItemGroups":[{"actionItems":[{"id":"a-255-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-line","selectorGuids":["ef06954a-fe94-13e7-ed57-44beb07cd241"]},"widthValue":100,"widthUnit":"%","heightUnit":"PX","locked":false}}]},{"actionItems":[{"id":"a-255-n-2","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-line","selectorGuids":["ef06954a-fe94-13e7-ed57-44beb07cd241"]},"widthValue":0,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":true,"createdOn":1640019738933},"a-256":{"id":"a-256","title":"Button Text Hover [Out]","actionItemGroups":[{"actionItems":[{"id":"a-256-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".button-text-line","selectorGuids":["ef06954a-fe94-13e7-ed57-44beb07cd241"]},"widthValue":100,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":false,"createdOn":1640019738933}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function ButtonTextInverse(
    {
        as: _Component = _Builtin.Link,
        text = "Button",
        link
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component
            className="button-text inverse"
            button={false}
            block="inline"
            options={link}><_Builtin.Block className="button-text-inner" tag="div"><_Builtin.Block className="button-text-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="button-text-line inverse" tag="div" /></_Builtin.Block></_Component>
    );
}