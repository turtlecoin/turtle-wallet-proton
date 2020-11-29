// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { session, eventEmitter } from "../index";
import { uiType } from "../utils/utils";

type Props = {
    darkMode: boolean
};

type State = {
    syncPercentage: number,
    networkBlockHeight: number
};

export default class SyncReminder extends Component<Props, State> {
    props: Props;

    state: State;

    syncInterval: IntervalID;

    constructor(props?: Props) {
        super(props);
        this.state = {
            syncPercentage: session.getSyncPercentage(),
            networkBlockHeight: session.getNetworkBlockHeight()
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
            networkBlockHeight: session.getNetworkBlockHeight(),
            syncPercentage: session.getSyncPercentage()
        });
    }

    render() {
        const { syncPercentage, networkBlockHeight } = this.state;
        const { darkMode } = this.props;
        const { textColor } = uiType(darkMode);

        return (
            <div className="syncreminder">
                {syncPercentage < 100 && networkBlockHeight !== 0 && (
                    <p className={`${textColor} glow`}>
                        <i className="fas fa-sync fa-spin" /> &nbsp;Don&apos;t
                        panic! Your wallet is still syncing...
                    </p>
                )}
                {syncPercentage === 100 && networkBlockHeight !== 0 && (
                    <p className={`${textColor} glow-green`}>
                        <i className="fas fa-check-circle" /> &nbsp;Your wallet
                        is fully synced.
                    </p>
                )}
                {networkBlockHeight === 0 && (
                    <p className={`${textColor} glow-red`}>
                        <i className="fas fa-times" /> &nbsp;The connected node
                        appears to be offline.
                    </p>
                )}
            </div>
        );
    }
}
