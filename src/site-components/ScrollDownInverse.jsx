"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-1866":{"id":"e-1866","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-215","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2023"}},"mediaQueries":["main"],"target":{"selector":".scroll-down","originalId":"699c654968800a6c4e63cf84|883244b7-b283-6d42-84ab-f4c3407fdccc","appliesTo":"CLASS"},"targets":[{"selector":".scroll-down","originalId":"699c654968800a6c4e63cf84|883244b7-b283-6d42-84ab-f4c3407fdccc","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1675066541395}},"actionLists":{"a-215":{"id":"a-215","title":"Scroll Down Hover [In]","actionItemGroups":[{"actionItems":[{"id":"a-215-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":400,"target":{},"xValue":null,"yValue":30,"xUnit":"px","yUnit":"px","zUnit":"PX"}},{"id":"a-215-n-5","actionTypeId":"STYLE_OPACITY","config":{"delay":0,"easing":"outQuint","duration":400,"target":{},"value":0,"unit":""}}]},{"actionItems":[{"id":"a-215-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuint","duration":0,"target":{},"xValue":null,"yValue":-30,"xUnit":"px","yUnit":"px","zUnit":"PX"}}]},{"actionItems":[{"id":"a-215-n-4","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"outQuart","duration":400,"target":{},"xValue":null,"yValue":0,"xUnit":"px","yUnit":"px","zUnit":"PX"}},{"id":"a-215-n-6","actionTypeId":"STYLE_OPACITY","config":{"delay":0,"easing":"outQuart","duration":400,"target":{},"value":1,"unit":""}}]}],"useFirstGroupAsInitialState":false,"createdOn":1674846469880}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function ScrollDownInverse(
    {
        as: _Component = _Builtin.Link,
        link,
        text = "Text"
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component
            className="scroll-down inverse"
            button={false}
            block="inline"
            options={link}><_Builtin.Block className="text-meta" tag="div">{text}</_Builtin.Block><_Builtin.Block className="scroll-down-icon-wrapper" tag="div"><_Builtin.HtmlEmbed
                    className="scroll-down-icon"
                    value="%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22currentColor%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M204.24%2C148.24l-72%2C72a6%2C6%2C0%2C0%2C1-8.48%2C0l-72-72a6%2C6%2C0%2C0%2C1%2C8.48-8.48L122%2C201.51V40a6%2C6%2C0%2C0%2C1%2C12%2C0V201.51l61.76-61.75a6%2C6%2C0%2C0%2C1%2C8.48%2C8.48Z%22%2F%3E%3C%2Fsvg%3E" /></_Builtin.Block></_Component>
    );
}