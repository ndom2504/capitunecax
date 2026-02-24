"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";
import { Accordion } from "./components/Accordion";

const _interactionsData = JSON.parse(
    '{"events":{"e-2488":{"id":"e-2488","name":"","animationType":"preset","eventTypeId":"SCROLL_INTO_VIEW","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-274","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2489"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"1b8854bd-bffa-bee4-5211-60c751b24442","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"1b8854bd-bffa-bee4-5211-60c751b24442","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":0,"scrollOffsetUnit":"%","delay":null,"direction":null,"effectIn":null},"createdOn":1711006200804}},"actionLists":{"a-274":{"id":"a-274","title":"Move In Bottom [Delay 0.2s]","actionItemGroups":[{"actionItems":[{"id":"a-274-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"","duration":500,"target":{"useEventTarget":true,"id":"62fa3b4e46f480574e89a70c|a7ab49b1-7e04-4066-b939-5a81af3cd95a"},"yValue":105,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]},{"actionItems":[{"id":"a-274-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":200,"easing":"outQuart","duration":700,"target":{"useEventTarget":true,"id":"62fa3b4e46f480574e89a70c|a7ab49b1-7e04-4066-b939-5a81af3cd95a"},"yValue":0,"xUnit":"PX","yUnit":"%","zUnit":"PX"}}]}],"useFirstGroupAsInitialState":true,"createdOn":1647072653793}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function SectionFaq(
    {
        as: _Component = _Builtin.Block
    }
) {
    _interactions.useInteractions(_interactionsData);

    return (
        <_Component className="section-faq" tag="section" id="home-about"><_Builtin.Block className="padding-global" tag="div"><_Builtin.Block className="container-xlarge" tag="div"><_Builtin.Block className="margin-bottom margin-xlarge" tag="div"><_Builtin.Block className="text-align-center" tag="div"><_Builtin.Block className="overflow-hidden" tag="div"><_Builtin.Heading
                                    className="heading-style-h1"
                                    data-w-id="1b8854bd-bffa-bee4-5211-60c751b24442"
                                    tag="h2">{"FAQ"}</_Builtin.Heading></_Builtin.Block></_Builtin.Block></_Builtin.Block><_Builtin.Block className="container-small" tag="div"><_Builtin.Block
                            className="faq-grid-right"
                            id="w-node-_6c9e93c0-15a3-7be9-790a-5f33b51699e0-b51699d6"
                            tag="div"><Accordion
                                title="What services do you offer?"
                                text={<_Builtin.Paragraph>{"We offer a range of services including branding, website design, and UX/UI design, all tailored to meet your specific needs."}</_Builtin.Paragraph>} /><Accordion
                                title="How long does a typical project take?"
                                text={<_Builtin.Paragraph>{"Project timelines vary based on the scope and complexity, but most projects are completed within 4 to 8 weeks."}</_Builtin.Paragraph>} /><Accordion
                                title="Do you provide revisions?"
                                text={<_Builtin.Paragraph>{"Yes, we offer revisions to ensure the final product meets your expectations. The number of revisions depends on your chosen package."}</_Builtin.Paragraph>} /><Accordion
                                title="Will my website be mobile-friendly?"
                                text={<_Builtin.Paragraph>{"Absolutely! We design responsive websites that look great and function seamlessly across all devices, including mobile and tablets."}</_Builtin.Paragraph>} /><Accordion
                                title="How do you ensure the project stays on budget?"
                                text={<_Builtin.Paragraph>{"We provide transparent pricing upfront and maintain open communication throughout the project to ensure we stay within the agreed budget."}</_Builtin.Paragraph>} /></_Builtin.Block></_Builtin.Block></_Builtin.Block></_Builtin.Block></_Component>
    );
}