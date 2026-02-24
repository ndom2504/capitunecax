"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-2578":{"id":"e-2578","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-280","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2579"}},"mediaQueries":["main"],"target":{"selector":".navbar-menu-item","originalId":"6e15c14e-1146-0b20-61d1-6721f0646d5a","appliesTo":"CLASS"},"targets":[{"selector":".navbar-menu-item","originalId":"6e15c14e-1146-0b20-61d1-6721f0646d5a","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1716406165282},"e-2579":{"id":"e-2579","name":"","animationType":"custom","eventTypeId":"MOUSE_OUT","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-281","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2578"}},"mediaQueries":["main"],"target":{"selector":".navbar-menu-item","originalId":"6e15c14e-1146-0b20-61d1-6721f0646d5a","appliesTo":"CLASS"},"targets":[{"selector":".navbar-menu-item","originalId":"6e15c14e-1146-0b20-61d1-6721f0646d5a","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1716406165283}},"actionLists":{"a-280":{"id":"a-280","title":"Navbar Item [In]","actionItemGroups":[{"actionItems":[{"id":"a-280-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"outQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".navbar-item-line","selectorGuids":["9876633c-9065-66be-6fb1-3ec28ac6f43e"]},"widthValue":0,"widthUnit":"%","heightUnit":"PX","locked":false}}]},{"actionItems":[{"id":"a-280-n-2","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"inOutQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".navbar-item-line","selectorGuids":["9876633c-9065-66be-6fb1-3ec28ac6f43e"]},"widthValue":100,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":true,"createdOn":1668434754273},"a-281":{"id":"a-281","title":"Navbar Item [Out]","actionItemGroups":[{"actionItems":[{"id":"a-281-n-2","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"inOutQuart","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".navbar-item-line","selectorGuids":["9876633c-9065-66be-6fb1-3ec28ac6f43e"]},"widthValue":0,"widthUnit":"%","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":false,"createdOn":1668434754273}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function NavbarMenuItem(
    {
        as: _Component = _Builtin.Link,
        text = "Item",
        link
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component
            className="navbar-menu-item"
            button={false}
            id="Contact"
            block="inline"
            options={link}><_Builtin.Block className="navbar-menu-item-text" tag="div">{text}</_Builtin.Block><_Builtin.Block className="navbar-item-line" tag="div" /></_Component>
    );
}