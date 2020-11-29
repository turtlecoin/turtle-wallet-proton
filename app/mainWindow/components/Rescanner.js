// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { ipcRenderer } from "electron";
import { il8n, eventEmitter } from "../index";
import { uiType } from "../utils/utils";

type Props = {
    darkMode: boolean
};

type State = {
    scanHeight: string,
    rescanInProgress: boolean
};

export default class Rescanner extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props: Props) {
        super(props);
        this.state = {
            scanHeight: "",
            rescanInProgress: false
        };
        this.setRescanInProgress = this.setRescanInProgress.bind(this);
        this.confirmRescan = this.confirmRescan.bind(this);
        this.rescanWallet = this.rescanWallet.bind(this);
        this.handleRescanResponse = this.handleRescanResponse.bind(this);
    }

    componentWillMount() {
        eventEmitter.on("rescanWallet", this.rescanWallet);
        ipcRenderer.on("fromBackend", this.handleRescanResponse);
    }

    componentWillUnmount() {
        eventEmitter.off("rescanWallet", this.rescanWallet);
        ipcRenderer.off("fromBackend", this.handleRescanResponse);
    }

    handleRescanResponse(event: Electron.IpcRendererEvent, message: any) {
        const { messageType } = message;
        if (messageType === "rescanResponse") {
            this.setRescanInProgress(false);
        }
    }

    handleScanHeightChange = (event: any) => {
        this.setState({ scanHeight: event.target.value.trim() });
    };

    setRescanInProgress = (rescanInProgress: boolean) => {
        this.setState({
            rescanInProgress
        });
    };

    rescanWallet = () => {
        this.setRescanInProgress(true);
        const { scanHeight } = this.state;
        ipcRenderer.send(
            "fromFrontend",
            "rescanRequest",
            parseInt(scanHeight, 10)
        );
        this.setState({
            scanHeight: ""
        });
    };

    confirmRescan = () => {
        const { darkMode } = this.props;
        const { textColor } = uiType(darkMode);
        const { scanHeight } = this.state;

        if (
            Number.isNaN(parseInt(scanHeight, 10)) ||
            parseInt(scanHeight, 10) < 0
        ) {
            const message = (
                <div>
                    <center>
                        <p className="title has-text-danger">Error!</p>
                    </center>
                    <br />
                    <p className={`subtitle ${textColor}`}>
                        You haven&apos;t entered a valid block height. The input
                        must be a positive integer. Please try again.
                    </p>
                    <p className={`subtitle ${textColor}`} />
                </div>
            );
            eventEmitter.emit("openModal", message, "OK", null, null);
            this.setState({
                scanHeight: ""
            });
            return;
        }
        const message = (
            <div>
                <center>
                    <p className="title has-text-danger">Rescan Warning!</p>
                </center>
                <br />
                <p className={`subtitle ${textColor}`}>
                    {`You are about to rescan your wallet from block ${scanHeight}. Are you sure you want to do this? It could take a very long time.`}
                </p>
            </div>
        );
        eventEmitter.emit(
            "openModal",
            message,
            "OK",
            "Nevermind",
            "rescanWallet"
        );
    };

    render() {
        const { darkMode } = this.props;
        const { textColor } = uiType(darkMode);
        const { scanHeight, rescanInProgress } = this.state;

        return (
            <div>
                <p className={`has-text-weight-bold ${textColor}`}>
                    {il8n.rescan_wallet}
                </p>
                <div className="field has-addons">
                    <div className="control is-expanded">
                        <input
                            className="input"
                            type="text"
                            placeholder="Enter a height to scan from..."
                            value={scanHeight}
                            onChange={event => {
                                this.setState({
                                    scanHeight: event.target.value
                                });
                            }}
                            onKeyPress={event => {
                                if (event.key === "Enter") {
                                    this.confirmRescan();
                                }
                            }}
                        />
                    </div>
                    <div className="control">
                        <button
                            className={`button is-danger ${
                                rescanInProgress ? "is-loading" : ""
                            }`}
                            onClick={this.confirmRescan}
                        >
                            <span className="icon is-small">
                                <i className="fa fa-undo" />
                            </span>
                            &nbsp;&nbsp;{il8n.rescan}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
