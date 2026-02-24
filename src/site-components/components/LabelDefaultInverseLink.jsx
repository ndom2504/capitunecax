"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-1968":{"id":"e-1968","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-230","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1969"}},"mediaQueries":["main"],"target":{"selector":".label-link","originalId":"f0dc605d-fd1c-6322-da92-7ec8a9809648","appliesTo":"CLASS"},"targets":[{"selector":".label-link","originalId":"f0dc605d-fd1c-6322-da92-7ec8a9809648","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1677907006604},"e-1969":{"id":"e-1969","name":"","animationType":"custom","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-231","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-1968"}},"mediaQueries":["main"],"target":{"selector":".label-link","originalId":"f0dc605d-fd1c-6322-da92-7ec8a9809648","appliesTo":"CLASS"},"targets":[{"selector":".label-link","originalId":"f0dc605d-fd1c-6322-da92-7ec8a9809648","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1677907006607}},"actionLists":{"a-230":{"id":"a-230","title":"Label Link Hover [In]","actionItemGroups":[{"actionItems":[{"id":"a-230-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text","selectorGuids":["c452d09d-f720-ab15-3470-3086a53aa2cf"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-230-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text-hover","selectorGuids":["9e60af6e-3f84-3250-44c5-65149ff07cf1"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]},{"actionItems":[{"id":"a-230-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text","selectorGuids":["c452d09d-f720-ab15-3470-3086a53aa2cf"]},"yValue":-100,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-230-n-4","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text-hover","selectorGuids":["9e60af6e-3f84-3250-44c5-65149ff07cf1"]},"yValue":-100,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1677907016349},"a-231":{"id":"a-231","title":"Label Link Hover [Out]","actionItemGroups":[{"actionItems":[{"id":"a-231-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text","selectorGuids":["c452d09d-f720-ab15-3470-3086a53aa2cf"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-231-n-4","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".label-text-hover","selectorGuids":["9e60af6e-3f84-3250-44c5-65149ff07cf1"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":false,"createdOn":1677907016349}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function LabelDefaultInverseLink(
    {
        as: _Component = _Builtin.Link,
        link,
        text = "Label"
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component
            className="label-link inverse"
            button={false}
            block="inline"
            options={link}><_Builtin.Block className="label-inner" tag="div"><_Builtin.Block className="label-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="label-text-hover" tag="div">{text}</_Builtin.Block></_Builtin.Block></_Component>
    );
}