"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-3226":{"id":"e-3226","name":"","animationType":"custom","eventTypeId":"PAGE_START","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-293","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-3227"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"wf-page-id","appliesTo":"PAGE","styleBlockIds":[]},"targets":[{"id":"wf-page-id","appliesTo":"PAGE","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1728900564174}},"actionLists":{"a-293":{"id":"a-293","title":"Pageloder [Out]","actionItemGroups":[{"actionItems":[{"id":"a-293-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"selector":".pageloader","selectorGuids":["15555fca-df6b-9bf5-bee0-950353aea9a5"]},"yValue":0,"xUnit":"PX","yUnit":"vh","zUnit":"PX"}},{"id":"a-293-n-2","actionTypeId":"GENERAL_DISPLAY","config":{"delay":0,"easing":"","duration":0,"target":{"selector":".pageloader","selectorGuids":["15555fca-df6b-9bf5-bee0-950353aea9a5"]},"value":"none"}},{"id":"a-293-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"selector":".pageloader-heading","selectorGuids":["fb27616f-a60c-6a84-77f9-ca555da8eac7"]},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]},{"actionItems":[{"id":"a-293-n-4","actionTypeId":"GENERAL_DISPLAY","config":{"delay":0,"easing":"","duration":0,"target":{"selector":".pageloader","selectorGuids":["15555fca-df6b-9bf5-bee0-950353aea9a5"]},"value":"flex"}}]},{"actionItems":[{"id":"a-293-n-5","actionTypeId":"TRANSFORM_MOVE","config":{"delay":300,"easing":"inOutQuart","duration":1000,"target":{"selector":".pageloader-heading","selectorGuids":["fb27616f-a60c-6a84-77f9-ca555da8eac7"]},"yValue":-101,"xUnit":"PX","yUnit":"%","zUnit":"PX"}},{"id":"a-293-n-6","actionTypeId":"TRANSFORM_MOVE","config":{"delay":500,"easing":"inOutQuint","duration":1200,"target":{"selector":".pageloader","selectorGuids":["15555fca-df6b-9bf5-bee0-950353aea9a5"]},"yValue":-100,"xUnit":"PX","yUnit":"vh","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1728900575226}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function Pageloader(
    {
        as: _Component = _Builtin.Block,
        title = "Title"
    }
) {
    _interactions.useInteractions(_interactionsData);
    return <_Component className="pageloader" tag="div"><_Builtin.Block className="overflow-hidden" tag="div"><_Builtin.Block className="pageloader-heading" tag="div">{title}</_Builtin.Block></_Builtin.Block></_Component>;
}