// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import ReactLoading from "react-loading";
import ReactTooltip from "react-tooltip";
import { session, eventEmitter } from "../index";

type Props = {
    size: string,
    darkMode: boolean
};

type State = {
    walletBlockheight: number,
    networkBlockheight: number,
    syncPercentage: number
};

export default class SyncStatus extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props?: Props) {
        super(props);
        this.state = {
            walletBlockHeight: session.getWalletBlockHeight(),
            networkBlockHeight: session.getNetworkBlockHeight(),
            syncPercentage: session.getSyncPercentage()
        };

        this.handleNewSyncStatus = this.handleNewSyncStatus.bind(this);
    }

    componentDidMount() {
        eventEmitter.on("gotSyncStatus", this.handleNewSyncStatus);
    }

    componentWillUnmount() {
        eventEmitter.off("gotSyncStatus", this.handleNewSyncStatus);
    }

    handleNewSyncStatus() {
        this.setState({
            walletBlockHeight: session.getWalletBlockHeight(),
            networkBlockHeight: session.getNetworkBlockHeight(),
            syncPercentage: session.getSyncPercentage()
        });
        ReactTooltip.rebuild();
    }

    render() {
        const {
            walletBlockHeight,
            networkBlockHeight,
            syncPercentage
        } = this.state;
        const { darkMode, size } = this.props;
        const color = darkMode ? "is-dark" : "is-white";

        const syncTooltip =
            session.getNetworkBlockHeight() === 0
                ? "Connecting, please wait..."
                : `${walletBlockHeight}/${networkBlockHeight}`;
        return (
            <div className="control statusicons">
                <div className="tags has-addons">
                    <span
                        className={
                            darkMode
                                ? `tag ${color} ${size}`
                                : `tag ${color} ${size}`
                        }
                    >
                        Sync:
                    </span>
                    {syncPercentage < 100 && networkBlockHeight !== 0 && (
                        <span
                            className={`tag is-warning ${size} sync-status`}
                            data-tip={syncTooltip}
                        >
                            {syncPercentage}%
                            <ReactLoading
                                type="bubbles"
                                color="#363636"
                                height={30}
                                width={30}
                            />
                        </span>
                    )}
                    {syncPercentage === 100 && networkBlockHeight !== 0 && (
                        <span
                            className={`tag is-success ${size} sync-status`}
                            data-tip={syncTooltip}
                        >
                            {syncPercentage}%
                        </span>
                    )}
                    {networkBlockHeight === 0 && (
                        <span
                            className={`tag is-danger ${size} sync-status`}
                            data-tip={syncTooltip}
                        >
                            <ReactLoading
                                type="spinningBubbles"
                                color="#F5F5F5"
                                height={25}
                                width={25}
                            />
                        </span>
                    )}
                </div>
            </div>
        );
    }
}
