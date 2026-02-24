"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-2570":{"id":"e-2570","name":"","animationType":"custom","eventTypeId":"MOUSE_CLICK","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-100","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2571"}},"mediaQueries":["main","medium","small","tiny"],"target":{"selector":".accordion","originalId":"8b052465-7793-c16b-6c10-5e669b9d75fc","appliesTo":"CLASS"},"targets":[{"selector":".accordion","originalId":"8b052465-7793-c16b-6c10-5e669b9d75fc","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1716107023672},"e-2571":{"id":"e-2571","name":"","animationType":"custom","eventTypeId":"MOUSE_SECOND_CLICK","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-101","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2570"}},"mediaQueries":["main","medium","small","tiny"],"target":{"selector":".accordion","originalId":"8b052465-7793-c16b-6c10-5e669b9d75fc","appliesTo":"CLASS"},"targets":[{"selector":".accordion","originalId":"8b052465-7793-c16b-6c10-5e669b9d75fc","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1716107023707}},"actionLists":{"a-100":{"id":"a-100","title":"Accordion [Open]","actionItemGroups":[{"actionItems":[{"id":"a-100-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".accordion-content-wrapper","selectorGuids":["8e26c805-1869-35a9-c399-4e34da714f1c"]},"widthValue":100,"heightValue":0,"widthUnit":"%","heightUnit":"px","locked":false}}]},{"actionItems":[{"id":"a-100-n-2","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"ease","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".accordion-content-wrapper","selectorGuids":["8e26c805-1869-35a9-c399-4e34da714f1c"]},"widthValue":100,"widthUnit":"%","heightUnit":"AUTO","locked":false}},{"id":"a-100-n-3","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"ease","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".accordion-icon","selectorGuids":["9494a078-40da-41b9-98b5-c08a99584e97"]},"zValue":45,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1658813689934},"a-101":{"id":"a-101","title":"Accordion [Close]","actionItemGroups":[{"actionItems":[{"id":"a-101-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"ease","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".accordion-content-wrapper","selectorGuids":["8e26c805-1869-35a9-c399-4e34da714f1c"]},"widthValue":100,"heightValue":0,"widthUnit":"%","heightUnit":"px","locked":false}},{"id":"a-101-n-2","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"ease","duration":300,"target":{"useEventTarget":"CHILDREN","selector":".accordion-icon","selectorGuids":["9494a078-40da-41b9-98b5-c08a99584e97"]},"zValue":0,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}}]}],"useFirstGroupAsInitialState":false,"createdOn":1658813689934}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function Accordion(
    {
        as: _Component = _Builtin.Block,
        title = "Title",
        text = ""
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component className="accordion" tag="div"><_Builtin.Block className="accordion-title-wapper" tag="div"><_Builtin.Block className="accordion-title-grid" tag="div"><_Builtin.Heading
                        className="accordion-title"
                        id="w-node-_8b052465-7793-c16b-6c10-5e669b9d75ff-9b9d75fc"
                        tag="h3">{title}</_Builtin.Heading><_Builtin.Block className="accordion-icon-wrapper" tag="div"><_Builtin.HtmlEmbed
                            className="accordion-icon"
                            value="%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%3E%3Cpath%20d%3D%22M11%2011V5H13V11H19V13H13V19H11V13H5V11H11Z%22%2F%3E%3C%2Fsvg%3E" /></_Builtin.Block></_Builtin.Block></_Builtin.Block><_Builtin.Block className="accordion-content-wrapper" tag="div"><_Builtin.Block className="accordion-content" tag="div"><_Builtin.Block className="text-color-muted" tag="div"><_Builtin.RichText className="text-rich-text" tag="div" slot="">{text}</_Builtin.RichText></_Builtin.Block></_Builtin.Block></_Builtin.Block></_Component>
    );
}