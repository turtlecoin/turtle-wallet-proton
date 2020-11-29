// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import Send from "../components/Send";

type Props = {
    match: {
        params: {
            address: string,
            paymentid: string
        }
    }
};

export default class SendPage extends Component<Props> {
    props: Props;

    render() {
        // prettier-ignore
        const { match: { params: { address, paymentid } } } = this.props;
        return <Send uriAddress={address} uriPaymentID={paymentid} />;
    }
}
