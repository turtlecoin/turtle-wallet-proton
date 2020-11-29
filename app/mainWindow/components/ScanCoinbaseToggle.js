// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { ipcRenderer } from "electron";
import { config, configManager } from "../index";
import { uiType } from "../utils/utils";

type State = {
    scanCoinbaseTransactions: boolean
};

type Props = {
    darkMode: boolean
};

export default class ScanCoinbaseToggle extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            scanCoinbaseTransactions: config.scanCoinbaseTransactions || false
        };
        this.toggleScanCoinbase = this.toggleScanCoinbase.bind(this);
    }

    componentWillMount() {}

    componentWillUnmount() {}

    toggleScanCoinbase = () => {
        const { scanCoinbaseTransactions } = this.state;
        configManager.modifyConfig(
            "scanCoinbaseTransactions",
            !scanCoinbaseTransactions
        );
        this.setState({
            scanCoinbaseTransactions: !scanCoinbaseTransactions
        });
        ipcRenderer.send(
            "fromFrontend",
            "scanCoinbaseRequest",
            !scanCoinbaseTransactions
        );
    };

    render() {
        const { darkMode } = this.props;
        const { textColor } = uiType(darkMode);
        const { scanCoinbaseTransactions } = this.state;
        return (
            <div>
                {scanCoinbaseTransactions === false && (
                    <span className={`flex-items-center ${textColor}`}>
                        <a
                            className="button is-danger"
                            onClick={this.toggleScanCoinbase}
                            onKeyPress={this.toggleScanCoinbase}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large">
                                <i className="fas fa-times" />
                            </span>
                        </a>
                        &nbsp;&nbsp; Scan Coinbase Transactions: <b>Off</b>
                    </span>
                )}
                {scanCoinbaseTransactions === true && (
                    <span className={`flex-items-center ${textColor}`}>
                        <a
                            className="button is-success"
                            onClick={this.toggleScanCoinbase}
                            onKeyPress={this.toggleScanCoinbase}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large">
                                <i className="fa fa-check" />
                            </span>
                        </a>
                        &nbsp;&nbsp; Scan Coinbase Transactions: <b>On</b>{" "}
                        &nbsp;&nbsp;
                    </span>
                )}
            </div>
        );
    }
}
