"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-1182":{"id":"e-1182","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-179","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1803"}},"mediaQueries":["main"],"target":{"selector":".nav-item","originalId":"f1e0bcdc-46e9-b1cc-d26d-8781b0eb86c7","appliesTo":"CLASS"},"targets":[{"selector":".nav-item","originalId":"f1e0bcdc-46e9-b1cc-d26d-8781b0eb86c7","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1668434707609},"e-1183":{"id":"e-1183","name":"","animationType":"custom","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-180","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1182"}},"mediaQueries":["main"],"target":{"selector":".nav-item","originalId":"f1e0bcdc-46e9-b1cc-d26d-8781b0eb86c7","appliesTo":"CLASS"},"targets":[{"selector":".nav-item","originalId":"f1e0bcdc-46e9-b1cc-d26d-8781b0eb86c7","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1668434707610}},"actionLists":{"a-179":{"id":"a-179","title":"Nav Item [In]","actionItemGroups":[{"actionItems":[{"id":"a-179-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".nav-item-line","selectorGuids":["f679edc6-1206-94b5-34cc-d1ba0e9d5789"]},"widthValue":0,"widthUnit":"%","heightUnit":"PX","locked":false}}]},{"actionItems":[{"id":"a-179-n-2","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".nav-item-line","selectorGuids":["f679edc6-1206-94b5-34cc-d1ba0e9d5789"]},"widthValue":100,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":true,"createdOn":1668434712641},"a-180":{"id":"a-180","title":"Nav Item [Out]","actionItemGroups":[{"actionItems":[{"id":"a-180-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".nav-item-line","selectorGuids":["f679edc6-1206-94b5-34cc-d1ba0e9d5789"]},"widthValue":0,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":false,"createdOn":1668434754273}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function NavItem(
    {
        as: _Component = _Builtin.Link,
        text = "Item",
        link
    }
) {
    _interactions.useInteractions(_interactionsData);
    return <_Component className="nav-item" button={false} block="inline" options={link}><_Builtin.Block className="nav-item-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="nav-item-line" tag="div" /></_Component>;
}