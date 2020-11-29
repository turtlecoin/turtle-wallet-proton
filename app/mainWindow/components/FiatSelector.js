// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import Select from "react-select";
import log from "electron-log";
import { config, session, configManager } from "../index";
import currencies from "../constants/currencies.json";
import { uiType } from "../utils/utils";

type Props = {
    darkMode: boolean
};

type State = {
    selectedFiat: any
};

export default class FiatSelector extends Component<Props, State> {
    props: Props;

    state: State;

    options: any[];

    constructor(props?: Props) {
        super(props);
        this.options = currencies.map(currency => {
            return {
                value: currency.ticker,
                label: `${currency.symbol} ${currency.ticker.toUpperCase()}`
            };
        });
        this.state = {
            selectedFiat: this.search(
                config.selectedFiat,
                this.options,
                "value"
            )
        };
        this.changeCurrency = this.changeCurrency.bind(this);
        this.handleFiatChange = this.handleFiatChange.bind(this);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    handleChange = (selectedFiat: any) => {
        this.setState({ selectedFiat });
    };

    changeCurrency = (
        selectedFiat: string,
        fiatSymbol: string,
        symbolLocation: string,
        fiatDecimals: number
    ) => {
        log.debug(
            `User has selected ${selectedFiat} as alternate display currency.`
        );
        configManager.modifyConfig("selectedFiat", selectedFiat);
        configManager.modifyConfig("fiatSymbol", fiatSymbol);
        configManager.modifyConfig("symbolLocation", symbolLocation);
        configManager.modifyConfig("fiatDecimals", fiatDecimals);
        session.getFiatPrice(selectedFiat);
        this.setState({
            selectedFiat: this.search(
                config.selectedFiat,
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

    handleFiatChange = (event: any) => {
        const currency = this.search(event.value, currencies, "ticker");
        if (currency) {
            this.changeCurrency(
                currency.ticker,
                currency.symbol,
                currency.symbolLocation,
                currency.decimals
            );
        }
    };

    render() {
        const { darkMode } = this.props;
        const { selectedFiat } = this.state;
        const { textColor } = uiType(darkMode);

        return (
            <div>
                <p className={`has-text-weight-bold ${textColor}`}>
                    Alternate Display Currency:
                </p>
                <Select
                    value={selectedFiat}
                    onChange={this.handleFiatChange}
                    options={this.options}
                />
            </div>
        );
    }
}
