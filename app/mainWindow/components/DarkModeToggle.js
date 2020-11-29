// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { uiType } from "../utils/utils";
import { config, eventEmitter, configManager } from "../index";

type State = {
    darkMode: boolean
};

type Props = {};

export default class DarkModeToggle extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode
        };
        this.darkModeOn = this.darkModeOn.bind(this);
        this.darkModeOff = this.darkModeOff.bind(this);
    }

    componentWillMount() {}

    componentWillUnmount() {}

    darkModeOn = () => {
        this.setState({
            darkMode: true
        });
        config.darkMode = true;
        configManager.modifyConfig("darkmode", true);
        eventEmitter.emit("darkmodeon");
    };

    darkModeOff = () => {
        this.setState({
            darkMode: false
        });
        config.darkMode = false;
        configManager.modifyConfig("darkmode", false);
        eventEmitter.emit("darkmodeoff");
    };

    render() {
        const { darkMode } = this.state;
        const { textColor } = uiType(true);
        return (
            <div>
                {darkMode === true && (
                    <span className={`flex-items-center ${textColor}`}>
                        <a
                            className="button is-black"
                            onClick={this.darkModeOff}
                            onKeyPress={this.darkModeOff}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large has-text-warning">
                                <i className="fas fa-moon" />
                            </span>
                        </a>
                        &nbsp;&nbsp; Dark Mode: <b>on</b>
                    </span>
                )}
                {darkMode === false && (
                    <div className="flex-items-center">
                        <a
                            className="button is-info"
                            onClick={this.darkModeOn}
                            onKeyPress={this.darkModeOn}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="icon is-large has-text-warning">
                                <i className="fas fa-sun" />
                            </span>
                        </a>
                        <div>
                            &nbsp;&nbsp; Dark Mode: <b>off</b>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
