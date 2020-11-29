// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import Select from "react-select";
import log from "electron-log";
import * as moment from "moment-timezone";
import { config, session, configManager } from "../index";
import { uiType } from "../utils/utils";

type Props = {
    darkMode: boolean
};

type State = {
    selectedTimeZone: any
};

export default class TimeSelector extends Component<Props, State> {
    props: Props;

    state: State;

    options: any[];

    constructor(props?: Props) {
        super(props);
        this.options = moment.tz.names().map(tz => {
            return {
                value: tz,
                label: tz
            };
        });
        this.state = {
            selectedTimeZone: this.search(
                config.selectedTimeZone,
                this.options,
                "value"
            )
        };
        this.changeTimeZone = this.changeTimeZone.bind(this);
        this.handleTimeZoneChange = this.handleTimeZoneChange.bind(this);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    handleChange = (selectedTimeZone: any) => {
        this.setState({ selectedTimeZone });
    };

    changeTimeZone = (selectedTimeZone: string) => {
        log.debug(
            `User has selected ${selectedTimeZone} as display time zone.`
        );
        configManager.modifyConfig("selectedTimeZone", selectedTimeZone);
        session.getTimeZone(selectedTimeZone);
        this.setState({
            selectedTimeZone: this.search(
                config.selectedTimeZone,
                this.options,
                "value"
            )
        });
    };

    search(
        searchedValue: any,
        arrayToSearch: any[],
        objectPropertyName: string
    ) {
        for (let i = 0; i < arrayToSearch.length; i++) {
            if (arrayToSearch[i][objectPropertyName] === searchedValue) {
                return arrayToSearch[i];
            }
        }
    }

    handleTimeZoneChange = (event: any) => {
        const timeZone = event.value;
        if (timeZone) {
            this.changeTimeZone(timeZone);
        }
    };

    render() {
        const { darkMode } = this.props;
        const { selectedTimeZone } = this.state;
        const { textColor } = uiType(darkMode);

        return (
            <div>
                <p className={`has-text-weight-bold ${textColor}`}>
                    Wallet Display Time:
                </p>
                <Select
                    value={selectedTimeZone}
                    onChange={this.handleTimeZoneChange}
                    options={this.options}
                />
            </div>
        );
    }
}
