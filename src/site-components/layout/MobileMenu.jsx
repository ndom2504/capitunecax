"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";

const _interactionsData = JSON.parse(
    '{"events":{"e-3350":{"id":"e-3350","name":"","animationType":"custom","eventTypeId":"MOUSE_CLICK","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-300","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-3351"}},"mediaQueries":["small","tiny"],"target":{"selector":".mobile-menu-toggle","originalId":"eb0427c1-bb1c-e076-5734-e12e7079063f","appliesTo":"CLASS"},"targets":[{"selector":".mobile-menu-toggle","originalId":"eb0427c1-bb1c-e076-5734-e12e7079063f","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1729258832476},"e-3351":{"id":"e-3351","name":"","animationType":"custom","eventTypeId":"MOUSE_SECOND_CLICK","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-301","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-3350"}},"mediaQueries":["small","tiny"],"target":{"selector":".mobile-menu-toggle","originalId":"eb0427c1-bb1c-e076-5734-e12e7079063f","appliesTo":"CLASS"},"targets":[{"selector":".mobile-menu-toggle","originalId":"eb0427c1-bb1c-e076-5734-e12e7079063f","appliesTo":"CLASS"}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1729258832480}},"actionLists":{"a-300":{"id":"a-300","title":"Mobile Menu [Show]","actionItemGroups":[{"actionItems":[{"id":"a-300-n-5","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"yValue":-100,"xUnit":"PX","yUnit":"dvh","zUnit":"PX"}},{"id":"a-300-n-6","actionTypeId":"GENERAL_DISPLAY","config":{"delay":0,"easing":"","duration":0,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"value":"none"}},{"id":"a-300-n-9","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.top","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003b8"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-300-n-10","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.bottom","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003ba"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}}]},{"actionItems":[{"id":"a-300-n-7","actionTypeId":"GENERAL_DISPLAY","config":{"delay":0,"easing":"","duration":0,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"value":"block"}}]},{"actionItems":[{"id":"a-300-n-8","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":1000,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"yValue":0,"xUnit":"PX","yUnit":"dvh","zUnit":"PX"}},{"id":"a-300-n-12","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":700,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.bottom","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003ba"]},"yValue":-4,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-300-n-11","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":700,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.top","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003b8"]},"yValue":4,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-300-n-14","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":200,"easing":"inOutQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.top","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003b8"]},"zValue":-20,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}},{"id":"a-300-n-13","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":200,"easing":"inOutQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.bottom","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003ba"]},"xValue":null,"zValue":20,"xUnit":"deg","yUnit":"DEG","zUnit":"deg"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1729258856991},"a-301":{"id":"a-301","title":"Mobile Menu [Hide]","actionItemGroups":[{"actionItems":[{"id":"a-301-n-9","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.bottom","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003ba"]},"xValue":null,"zValue":0,"xUnit":"deg","yUnit":"DEG","zUnit":"deg"}},{"id":"a-301-n-10","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":500,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.top","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003b8"]},"zValue":0,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}},{"id":"a-301-n-7","actionTypeId":"TRANSFORM_MOVE","config":{"delay":100,"easing":"inOutQuint","duration":700,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.bottom","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003ba"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-301-n-8","actionTypeId":"TRANSFORM_MOVE","config":{"delay":100,"easing":"inOutQuint","duration":700,"target":{"useEventTarget":"CHILDREN","selector":".menu-toggle-line.top","selectorGuids":["262e933c-8bc5-e013-7a8a-c113868003b7","262e933c-8bc5-e013-7a8a-c113868003b8"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-301-n-11","actionTypeId":"TRANSFORM_MOVE","config":{"delay":300,"easing":"inOutQuint","duration":700,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"yValue":-100,"xUnit":"PX","yUnit":"dvh","zUnit":"PX"}}]},{"actionItems":[{"id":"a-301-n-5","actionTypeId":"GENERAL_DISPLAY","config":{"delay":0,"easing":"","duration":0,"target":{"selector":".mobile-menu","selectorGuids":["da9f38a6-35ad-ecc8-503a-10e34e380e29"]},"value":"none"}}]}],"useFirstGroupAsInitialState":false,"createdOn":1729258856991}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function MobileMenu(
    {
        as: _Component = _Builtin.Block
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component className="mobile-menu" tag="div"><_Builtin.Block className="mobile-menu-wrapper" tag="div"><_Builtin.Block className="mobile-menu-nav" tag="nav"><_Builtin.Link
                        className="mobile-menu-nav-item"
                        button={false}
                        block="inline"
                        options={{
                            href: "#"
                        }}><_Builtin.Block className="menu-nav-item-text" tag="div">{"Work"}</_Builtin.Block></_Builtin.Link><_Builtin.Link
                        className="mobile-menu-nav-item"
                        button={false}
                        block="inline"
                        options={{
                            href: "#"
                        }}><_Builtin.Block className="menu-nav-item-text" tag="div">{"About"}</_Builtin.Block></_Builtin.Link><_Builtin.Link
                        className="mobile-menu-nav-item"
                        button={false}
                        block="inline"
                        options={{
                            href: "#"
                        }}><_Builtin.Block className="menu-nav-item-text" tag="div">{"Services"}</_Builtin.Block></_Builtin.Link><_Builtin.Link
                        className="mobile-menu-nav-item"
                        button={false}
                        block="inline"
                        options={{
                            href: "#"
                        }}><_Builtin.Block className="menu-nav-item-text" tag="div">{"Blog"}</_Builtin.Block></_Builtin.Link><_Builtin.Link
                        className="mobile-menu-nav-item"
                        button={false}
                        block="inline"
                        options={{
                            href: "#"
                        }}><_Builtin.Block className="menu-nav-item-text" tag="div">{"Contact"}</_Builtin.Block></_Builtin.Link></_Builtin.Block></_Builtin.Block></_Component>
    );
}