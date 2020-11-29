// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { config, eventEmitter, configManager } from "../index";
import { uiType } from "../utils/utils";

type Props = {
    darkMode: boolean
};

type State = {
    selectedTimeout: number,
    timeoutEnabled: boolean
};

export default class TimeoutSelector extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props?: Props) {
        super(props);
        this.state = {
            selectedTimeout: config.autoLockInterval,
            timeoutEnabled: config.autoLockEnabled
        };
        this.handleTimeoutChange = this.handleTimeoutChange.bind(this);
        this.disableTimeout = this.disableTimeout.bind(this);
        this.enableTimeout = this.enableTimeout.bind(this);
        this.updateTimeoutInConfig = this.updateTimeoutInConfig.bind(this);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    disableTimeout = () => {
        this.setState({
            timeoutEnabled: false
        });
        configManager.modifyConfig("autoLockEnabled", false);
        eventEmitter.emit("setAutoLock", false);
    };

    enableTimeout = () => {
        this.setState({
            timeoutEnabled: true
        });
        configManager.modifyConfig("autoLockEnabled", true);
        eventEmitter.emit("setAutoLock", true);
    };

    handleTimeoutChange = (event: any) => {
        event.preventDefault();
        const timeout: string = event.target.value;
        const regex = /^\d*(\.(\d\d?)?)?$/;
        if (!regex.test(timeout) === true) {
            return;
        }
        this.setState({
            selectedTimeout: event.target.value
        });
    };

    updateTimeoutInConfig = (event: any) => {
        event.preventDefault();
        const { darkMode } = this.props;
        const { textColor } = uiType(darkMode);
        if (event.target[0].value === "" || event.target[0].value === "0") {
            return;
        }
        const interval: number = Number(event.target[0].value);
        if (interval > 35791) {
            const message = (
                <div>
                    <center>
                        <p className="title has-text-danger">Value Too High!</p>
                    </center>
                    <br />
                    <p className={`subtitle ${textColor}`}>
                        Because of a JavaScript limitation, the highest you can
                        set this to is 35,791 minutes.
                    </p>
                </div>
            );
            eventEmitter.emit("openModal", message, "OK", null, null);
            return;
        }
        if (interval) configManager.modifyConfig("autoLockInterval", interval);
        eventEmitter.emit("newLockInterval", interval);
    };

    render() {
        const { darkMode } = this.props;
        const { selectedTimeout, timeoutEnabled } = this.state;
        const { textColor } = uiType(darkMode);
        return (
            <div>
                <p className={`has-text-weight-bold ${textColor}`}>
                    Autolock Time Interval (in minutes):
                </p>
                <form onSubmit={this.updateTimeoutInConfig}>
                    <div className="field has-addons">
                        <div className="control is-expanded">
                            <input
                                className="input"
                                type="text"
                                value={selectedTimeout}
                                onChange={this.handleTimeoutChange}
                                disabled={!timeoutEnabled}
                            />
                        </div>
                        <div className="control">
                            <button
                                className="button is-success"
                                disabled={!timeoutEnabled}
                            >
                                <span className="icon is-small">
                                    <i className="fa fa-save" />
                                </span>
                                &nbsp;&nbsp; Change
                            </button>
                        </div>
                    </div>
                </form>
                <br />
                {timeoutEnabled && (
                    <span className={`flex-items-center ${textColor}`}>
                        <a
                            className="button is-success"
                            onClick={this.disableTimeout}
                            onKeyPress={this.disableTimeout}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large">
                                <i className="fas fa-check" />
                            </span>
                        </a>
                        &nbsp;&nbsp; Inactivity Autolock: <b>On</b>
                    </span>
                )}
                {!timeoutEnabled && (
                    <span className={`flex-items-center ${textColor}`}>
                        <a
                            className="button is-danger"
                            onClick={this.enableTimeout}
                            onKeyPress={this.enableTimeout}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large">
                                <i className="fas fa-times" />
                            </span>
                        </a>
                        &nbsp;&nbsp; Inactivity Autolock: <b>Off</b>
                    </span>
                )}
            </div>
        );
    }
}
