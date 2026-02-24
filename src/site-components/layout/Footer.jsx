"use client";
import React from "react";
import * as _Builtin from "../_Builtin";
import * as _interactions from "../interactions";
import { NavItemInverse } from "../components/NavItemInverse";
import { ButtonPrimaryInverse } from "../components/ButtonPrimaryInverse";
import { BuyBadge } from "../BuyBadge";

const _interactionsData = JSON.parse(
    '{"events":{"e-2651":{"id":"e-2651","name":"","animationType":"preset","eventTypeId":"SCROLL_INTO_VIEW","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-274","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2652"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"e0427e19-9c15-88b0-7f6d-5f8612891581","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"e0427e19-9c15-88b0-7f6d-5f8612891581","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":0,"scrollOffsetUnit":"%","delay":null,"direction":null,"effectIn":null},"createdOn":1728478452893}},"actionLists":{"a-274":{"id":"a-274","title":"Move In Bottom [Delay 0.2s]","actionItemGroups":[{"actionItems":[{"id":"a-274-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":true,"id":"62fa3b4e46f480574e89a70c|a7ab49b1-7e04-4066-b939-5a81af3cd95a"},"yValue":105,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]},{"actionItems":[{"id":"a-274-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":200,"easing":"outQuart","duration":700,"target":{"useEventTarget":true,"id":"62fa3b4e46f480574e89a70c|a7ab49b1-7e04-4066-b939-5a81af3cd95a"},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1647072653793}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function Footer(
    {
        as: _Component = _Builtin.Block,
        borderTopVisibility
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component className="footer" tag="footer"><_Builtin.Block className="footer-top" tag="div"><_Builtin.Block className="overflow-hidden" tag="div"><_Builtin.Heading
                        className="heading-style-xxlarge"
                        data-w-id="e0427e19-9c15-88b0-7f6d-5f8612891581"
                        tag="h2">{"KAyO©"}</_Builtin.Heading></_Builtin.Block></_Builtin.Block><_Builtin.Block className="footer-bottom" tag="div"><_Builtin.Block className="footer-nav" tag="div"><_Builtin.Block
                        className="footer-column"
                        id="w-node-_3670a912-1809-106b-f3d9-9230761f3f63-3fd6c0e0"
                        tag="div"><_Builtin.Block className="text-meta text-color-muted-inverse" tag="div">{"(Pages)"}</_Builtin.Block><_Builtin.Block className="nav center-phone-landscape" tag="div"><NavItemInverse
                                text="Home"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Service"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="About"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Contact"
                                link={{
                                    href: "#"
                                }} /></_Builtin.Block><ButtonPrimaryInverse
                            text="More Templates"
                            link={{
                                href: "https://templates.gola.io/",
                                target: "_blank"
                            }} /></_Builtin.Block><_Builtin.Block
                        className="footer-column"
                        id="w-node-_686359cd-f025-19c1-cbaf-c1333ca4d53a-3fd6c0e0"
                        tag="div"><_Builtin.Block className="text-meta text-color-muted-inverse" tag="div">{"(CMS)"}</_Builtin.Block><_Builtin.Block className="nav center-phone-landscape" tag="div"><NavItemInverse
                                text="Work"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Work Single"
                                link={{
                                    href: "https://kayo-template.webflow.io/work/utosia"
                                }} /><NavItemInverse
                                text="Blog"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Blog Single"
                                link={{
                                    href: "https://kayo-template.webflow.io/post/how-to-create-an-effective-brand-identity"
                                }} /><NavItemInverse
                                text="Pricing"
                                link={{
                                    href: "#"
                                }} /><_Builtin.NotSupported _atom="CommerceCartWrapper" /></_Builtin.Block></_Builtin.Block><_Builtin.Block
                        className="footer-column"
                        id="w-node-_3670a912-1809-106b-f3d9-9230761f3f70-3fd6c0e0"
                        tag="div"><_Builtin.Block className="text-meta text-color-muted-inverse" tag="div">{"(Utility Pages)"}</_Builtin.Block><_Builtin.Block className="nav center-phone-landscape" tag="div"><NavItemInverse
                                text="404"
                                link={{
                                    href: "https://kayo-template.webflow.io/404"
                                }} /><NavItemInverse
                                text="Password Page"
                                link={{
                                    href: "https://kayo-template.webflow.io/401"
                                }} /><NavItemInverse
                                text="Changelog"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Licensing"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Styleguide"
                                link={{
                                    href: "#"
                                }} /></_Builtin.Block></_Builtin.Block><_Builtin.Block
                        className="footer-column"
                        id="w-node-_3670a912-1809-106b-f3d9-9230761f3f7f-3fd6c0e0"
                        tag="div"><_Builtin.Block className="text-meta text-color-muted-inverse" tag="div">{"(Socials)"}</_Builtin.Block><_Builtin.Block className="nav center-phone-landscape" tag="div"><NavItemInverse
                                text="Instagram"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Behance"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Dribbble"
                                link={{
                                    href: "#"
                                }} /><NavItemInverse
                                text="Pinterest"
                                link={{
                                    href: "#"
                                }} /></_Builtin.Block></_Builtin.Block></_Builtin.Block><_Builtin.Block className="footer-bottom-grid" tag="div"><_Builtin.Block className="text-meta" tag="div">{"Made by "}<_Builtin.Link
                            className="text-color-default-inverse"
                            button={false}
                            block=""
                            options={{
                                href: "#",
                                target: "_blank"
                            }}>{"Gola Templates"}</_Builtin.Link></_Builtin.Block></_Builtin.Block></_Builtin.Block><BuyBadge /></_Component>
    );
}