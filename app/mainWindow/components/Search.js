// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component, Fragment } from "react";
import { remote, ipcRenderer } from "electron";
import { Link, Redirect } from "react-router-dom";
import jdenticon from "jdenticon";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import {
    uiType,
    formatLikeCurrency,
    atomicToHuman,
    convertTimestamp
} from "../utils/utils";
import {
    session,
    addressList,
    il8n,
    config,
    eventEmitter,
    loginCounter
} from "../index";
import routes from "../constants/routes";
import settings from "../constants/settings";
import Configure from "../../configure";

type Props = {
    query: string
};

type States = {
    darkMode: boolean,
    contactResults: string[],
    transactionResults: any[],
    expandedRows: string[],
    displayCurrency: string,
    fiatSymbol: string,
    symbolLocation: string,
    fiatPrice: number,
    query: string,
    redirect: boolean,
    redirectTo: string,
    settingsResults: any[],
    fiatDecimals: number,
    backendResultsReceived: boolean
};

export default class Search extends Component<Props, States> {
    props: Props;

    states: States;

    addressList: any[];

    transactions: any[];

    constructor(props?: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode,
            contactResults: [],
            transactionResults: [],
            expandedRows: [],
            displayCurrency: config.displayCurrency,
            fiatPrice: session.fiatPrice,
            fiatSymbol: config.fiatSymbol,
            symbolLocation: config.symbolLocation,
            fiatDecimals: config.fiatDecimals,
            query: props.query,
            settingsResults: [],
            redirectTo: "",
            redirect: false,
            backendResultsReceived: false
        };
        this.addressList = addressList;
        this.getContactResults = this.getContactResults.bind(this);
        this.getTransactionResults = this.getTransactionResults.bind(this);
        this.getSettingsResults = this.getSettingsResults.bind(this);
        this.handleTransactionSearchResponse = this.handleTransactionSearchResponse.bind(
            this
        );
    }

    componentDidMount() {
        const { query } = this.props;
        this.getContactResults(query);
        this.getTransactionResults(query);
        this.getSettingsResults(query);
        this.setState({
            query
        });

        eventEmitter.on("gotFiatPrice", this.updateFiatPrice);
        eventEmitter.on("modifyCurrency", this.modifyCurrency);
        ipcRenderer.on("fromBackend", this.handleTransactionSearchResponse);
    }

    componentWillReceiveProps(newProps: any) {
        const { query } = newProps;
        this.getContactResults(query);
        this.getSettingsResults(query);
        this.getTransactionResults(query);
        this.setState({
            query,
            backendResultsReceived: false
        });
    }

    componentWillUnmount() {
        eventEmitter.off("gotFiatPrice", this.updateFiatPrice);
        eventEmitter.off("modifyCurrency", this.modifyCurrency);
        ipcRenderer.off("fromBackend", this.handleTransactionSearchResponse);
    }

    expandRow = (event: any) => {
        const hash = event.target.value;
        const { expandedRows } = this.state;
        if (!expandedRows.includes(hash)) {
            expandedRows.push(hash);
        } else {
            const index = expandedRows.indexOf(hash);
            if (index > -1) {
                expandedRows.splice(index, 1);
            }
        }
        this.setState({
            expandedRows
        });
    };

    handleTransactionSearchResponse = (
        event: Electron.IpcRendererEvent,
        message: any
    ) => {
        const { messageType, data } = message;

        if (messageType === "transactionSearchResponse") {
            this.setState({
                transactionResults: data,
                backendResultsReceived: true
            });
        }
    };

    modifyCurrency = (displayCurrency: string) => {
        this.setState({
            displayCurrency
        });
    };

    updateFiatPrice = (fiatPrice: number) => {
        this.setState({
            fiatPrice
        });
    };

    openSearchInExplorer = () => {
        const { query } = this.state;
        remote.shell.openExternal(
            `${
                Configure.explorerURL
            }/transaction.html?hash=${encodeURIComponent(query)}`
        );
    };

    openInExplorer = (event: any) => {
        const hash = event.target.value;
        remote.shell.openExternal(
            `${
                Configure.explorerURL
            }/transaction.html?hash=${encodeURIComponent(hash)}`
        );
    };

    getContactResults = (query: string) => {
        const possibleContactValues = ["name", "address", "paymentID"];

        const contactResults = possibleContactValues.map(value => {
            return this.search(query, addressList, value);
        });

        let sanitizedResults = [];

        /* the search function returns a separate array of results for each
       value searched, we need to concat them together with spread */
        for (let i = 0; i < contactResults.length; i++) {
            sanitizedResults = [...contactResults[i], ...sanitizedResults];
        }

        /* We don't want duplicates, so we're going to
       pass the array to a new Set to remove them */
        sanitizedResults = [
            ...new Set(this.filterNullValues(sanitizedResults))
        ];

        this.setState({
            contactResults: sanitizedResults
        });
    };

    getSettingsResults = (query: string) => {
        const possibleSettingsValues = [
            "description",
            "settingName",
            "keywords"
        ];

        const settingsResults = possibleSettingsValues.map(value => {
            return this.search(query, settings, value);
        });

        let sanitizedResults = [];

        for (let i = 0; i < settingsResults.length; i++) {
            sanitizedResults = [...settingsResults[i], ...sanitizedResults];
        }

        sanitizedResults = [
            ...new Set(this.filterNullValues(sanitizedResults))
        ];

        this.setState({
            settingsResults: sanitizedResults
        });
    };

    getTransactionResults = (query: string) => {
        ipcRenderer.send("fromFrontend", "transactionSearchQuery", query);
    };

    goToSetting(location: string) {
        let redirectTo: string = "";
        let redirect: boolean = false;

        if (location[0] === "/") {
            redirect = true;
            redirectTo = location;
        } else if (location[0] === ".") {
            const eventName = location.substr(1);
            eventEmitter.emit(eventName);
            redirect = false;
        } else {
            redirect = true;
            loginCounter.lastSettingsTab = location;
            redirectTo = "/settings";
        }

        this.setState({
            redirect,
            redirectTo
        });
    }

    filterNullValues(arr: any[]) {
        return arr.filter(Boolean);
    }

    search(
        searchedValue: any,
        arrayToSearch: any[],
        objectPropertyName: string
    ) {
        const resultsToReturn = [];
        for (let i = 0; i < arrayToSearch.length; i++) {
            // will resolve to true if the selected value contains the substring, case insensitive
            if (
                String(arrayToSearch[i][objectPropertyName])
                    .toUpperCase()
                    .includes(searchedValue.toUpperCase())
            ) {
                // return
                resultsToReturn.push(arrayToSearch[i]);
            }
        }
        return resultsToReturn;
    }

    render() {
        const {
            darkMode,
            contactResults,
            transactionResults,
            expandedRows,
            displayCurrency,
            symbolLocation,
            fiatPrice,
            fiatSymbol,
            fiatDecimals,
            settingsResults,
            redirectTo,
            redirect,
            backendResultsReceived
        } = this.state;

        if (redirect) {
            return <Redirect to={redirectTo} />;
        }
        const { query } = this.props;
        const {
            backgroundColor,
            textColor,
            tableMode,
            fillColor,
            elementBaseColor,
            settingsCogColor
        } = uiType(darkMode);

        const resultsFound =
            contactResults.length +
            transactionResults.length +
            settingsResults.length;

        return (
            <div>
                <Redirector />
                <div className={`wholescreen ${backgroundColor}`}>
                    <NavBar darkMode={darkMode} query={query} />
                    <div className={`maincontent ${backgroundColor}`}>
                        {contactResults.length > 0 && (
                            <div>
                                <p className={`subtitle ${textColor}`}>
                                    <b>Contacts:</b>
                                </p>
                            </div>
                        )}
                        {contactResults.length > 0 && (
                            <table
                                className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
                            >
                                <thead>
                                    <tr>
                                        <th className={textColor}>Icon</th>
                                        <th className={textColor}>Name</th>
                                        <th className={textColor}>Address</th>
                                        <th className={textColor}>
                                            Payment ID
                                        </th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {contactResults.map((contact: any) => {
                                        const {
                                            name,
                                            address,
                                            paymentID
                                        } = contact;
                                        return (
                                            <tr key={address}>
                                                <td>
                                                    <span
                                                        // eslint-disable-next-line react/no-danger
                                                        dangerouslySetInnerHTML={{
                                                            __html: jdenticon.toSvg(
                                                                address,
                                                                114
                                                            )
                                                        }}
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                                                        defaultValue={name}
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                                                        defaultValue={address}
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                                                        defaultValue={paymentID}
                                                        readOnly
                                                    />
                                                </td>
                                                <td>
                                                    <div className="contactButtons">
                                                        <Link
                                                            className={
                                                                textColor
                                                            }
                                                            to={`${routes.SEND}/${address}/${paymentID}`}
                                                        >
                                                            <i
                                                                className="fa fa-paper-plane is-size-3 has-text-centered"
                                                                aria-hidden="true"
                                                            />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {transactionResults.length > 0 && (
                            <div>
                                <p className={`subtitle ${textColor}`}>
                                    <b>Transactions:</b>
                                </p>
                            </div>
                        )}
                        {transactionResults.length > 0 && (
                            <table
                                className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
                            >
                                <thead>
                                    <tr>
                                        <th />
                                        <th className={textColor}>
                                            {il8n.date}
                                        </th>
                                        <th className={textColor}>
                                            {il8n.hash}
                                        </th>
                                        <th
                                            className={`has-text-right ${textColor}`}
                                        >
                                            {il8n.amount}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionResults.map((tx, index) => {
                                        const {
                                            timestamp,
                                            hash,
                                            paymentID,
                                            fee,
                                            unlockTime,
                                            blockHeight
                                        } = tx;

                                        const amount = tx.totalTxAmount;
                                        const rowIsExpanded = expandedRows.includes(
                                            hash
                                        );
                                        const toggleSymbol = rowIsExpanded
                                            ? "-"
                                            : "+";
                                        return (
                                            <Fragment key={index}>
                                                <tr>
                                                    <td>
                                                        <button
                                                            value={hash}
                                                            onClick={
                                                                this.expandRow
                                                            }
                                                            className={`transparent-button ${textColor}`}
                                                            onMouseDown={event =>
                                                                event.preventDefault()
                                                            }
                                                        >
                                                            {toggleSymbol}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        {timestamp === 0 && (
                                                            <p className="has-text-danger">
                                                                {
                                                                    il8n.unconfirmed
                                                                }
                                                            </p>
                                                        )}
                                                        {timestamp > 0 && (
                                                            <p>
                                                                {convertTimestamp(
                                                                    timestamp
                                                                )}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td>{hash}</td>
                                                    {amount < 0 && (
                                                        <td>
                                                            <p className="has-text-danger has-text-right">
                                                                {displayCurrency ===
                                                                    Configure.ticker &&
                                                                    atomicToHuman(
                                                                        amount,
                                                                        true
                                                                    )}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    symbolLocation ===
                                                                        "prefix" &&
                                                                    fiatPrice !==
                                                                        0 &&
                                                                    `-${fiatSymbol}${session
                                                                        .formatLikeCurrency(
                                                                            (
                                                                                fiatPrice *
                                                                                atomicToHuman(
                                                                                    amount,
                                                                                    false
                                                                                )
                                                                            ).toFixed(
                                                                                fiatDecimals
                                                                            )
                                                                        )
                                                                        .substring(
                                                                            1
                                                                        )}`}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    symbolLocation ===
                                                                        "suffix" &&
                                                                    fiatPrice !==
                                                                        0 &&
                                                                    `-${session
                                                                        .formatLikeCurrency(
                                                                            (
                                                                                fiatPrice *
                                                                                atomicToHuman(
                                                                                    amount,
                                                                                    false
                                                                                )
                                                                            ).toFixed(
                                                                                2
                                                                            )
                                                                        )
                                                                        .substring(
                                                                            1
                                                                        )}${fiatSymbol}`}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    fiatPrice ===
                                                                        0 &&
                                                                    ""}
                                                            </p>
                                                        </td>
                                                    )}
                                                    {amount > 0 && (
                                                        <td>
                                                            <p className="has-text-right">
                                                                {displayCurrency ===
                                                                    Configure.ticker &&
                                                                    atomicToHuman(
                                                                        amount,
                                                                        true
                                                                    )}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    symbolLocation ===
                                                                        "prefix" &&
                                                                    `${fiatSymbol}${formatLikeCurrency(
                                                                        (
                                                                            fiatPrice *
                                                                            atomicToHuman(
                                                                                amount,
                                                                                false
                                                                            )
                                                                        ).toFixed(
                                                                            fiatDecimals
                                                                        )
                                                                    )}`}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    symbolLocation ===
                                                                        "suffix" &&
                                                                    `${formatLikeCurrency(
                                                                        (
                                                                            fiatPrice *
                                                                            atomicToHuman(
                                                                                amount,
                                                                                false
                                                                            )
                                                                        ).toFixed(
                                                                            fiatDecimals
                                                                        )
                                                                    )}${fiatSymbol}`}
                                                            </p>
                                                        </td>
                                                    )}
                                                    {amount === 0 && (
                                                        <td>
                                                            <p className="has-text-right has-text-warning">
                                                                Fusion
                                                            </p>
                                                        </td>
                                                    )}
                                                </tr>
                                                {rowIsExpanded && (
                                                    <tr>
                                                        <td />
                                                        <td colSpan={4}>
                                                            <table className="swing-in-top-fwd">
                                                                <tbody>
                                                                    <tr className="no-hover">
                                                                        <td>
                                                                            <p>
                                                                                <b>
                                                                                    Date
                                                                                    &
                                                                                    Time
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Confirmations
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Block
                                                                                    Height
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Unlock
                                                                                    Time
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Transaction
                                                                                    Hash
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Payment
                                                                                    ID
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Fee
                                                                                </b>
                                                                                <br />
                                                                                <b>
                                                                                    Amount
                                                                                </b>
                                                                                <br />
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            {timestamp ===
                                                                            0
                                                                                ? "Still In Memory Pool"
                                                                                : convertTimestamp(
                                                                                      timestamp
                                                                                  )}
                                                                            <br />
                                                                            {timestamp !==
                                                                            0
                                                                                ? Math.max(
                                                                                      session.getNetworkBlockHeight() -
                                                                                          blockHeight,
                                                                                      0
                                                                                  )
                                                                                : 0}
                                                                            <br />
                                                                            {timestamp ===
                                                                            0
                                                                                ? "Still In Memory Pool"
                                                                                : formatLikeCurrency(
                                                                                      blockHeight
                                                                                  )}
                                                                            <br />
                                                                            {
                                                                                unlockTime
                                                                            }{" "}
                                                                            <br />
                                                                            {
                                                                                hash
                                                                            }{" "}
                                                                            <br />
                                                                            {paymentID !==
                                                                            ""
                                                                                ? paymentID
                                                                                : "none"}
                                                                            <br />
                                                                            {atomicToHuman(
                                                                                fee,
                                                                                true
                                                                            )}{" "}
                                                                            Configure.ticker
                                                                            <br />
                                                                            <p
                                                                                className={
                                                                                    amount <
                                                                                    0
                                                                                        ? "is-negative-transaction has-text-danger"
                                                                                        : ""
                                                                                }
                                                                            >
                                                                                {atomicToHuman(
                                                                                    amount,
                                                                                    true
                                                                                )}{" "}
                                                                                Configure.ticker
                                                                            </p>
                                                                            <br />
                                                                            <br />
                                                                            <button
                                                                                className={`button ${elementBaseColor}`}
                                                                                value={
                                                                                    hash
                                                                                }
                                                                                onClick={
                                                                                    this
                                                                                        .openInExplorer
                                                                                }
                                                                            >
                                                                                View
                                                                                on
                                                                                Block
                                                                                Explorer
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {settingsResults.length > 0 && (
                            <Fragment>
                                <table
                                    className={`table is-striped is-hoverable is-fullwidth ${tableMode}`}
                                >
                                    <thead>
                                        <tr>
                                            <th>
                                                <p
                                                    className={`${textColor} subtitle`}
                                                >
                                                    Settings Results:
                                                </p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settingsResults.map(setting => {
                                            const {
                                                location,
                                                settingName,
                                                description
                                            } = setting;
                                            return (
                                                <tr
                                                    onClick={() =>
                                                        this.goToSetting(
                                                            location
                                                        )
                                                    }
                                                >
                                                    <td>
                                                        <div className="columns">
                                                            <div className="column">
                                                                <p
                                                                    className={`${textColor} subtitle`}
                                                                >
                                                                    {
                                                                        settingName
                                                                    }
                                                                </p>
                                                                <p
                                                                    className={
                                                                        textColor
                                                                    }
                                                                >
                                                                    {
                                                                        description
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="column has-text-right">
                                                                <i className="fas fa-angle-right is-size-1 settingsCarot" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </Fragment>
                        )}
                        {backendResultsReceived && (
                            <div>
                                {resultsFound === 0 && (
                                    <div
                                        className={`box elem-to-center ${fillColor}`}
                                    >
                                        <p className="title has-text-danger has-text-centered">
                                            No results found!
                                        </p>{" "}
                                        {query.length === 64 && (
                                            <Fragment>
                                                <center>
                                                    <br />
                                                    <span
                                                        className={`button ${settingsCogColor}`}
                                                        onClick={
                                                            this
                                                                .openSearchInExplorer
                                                        }
                                                        onKeyPress={
                                                            this
                                                                .openSearchInExplorer
                                                        }
                                                        role="button"
                                                        tabIndex={0}
                                                        onMouseDown={event =>
                                                            event.preventDefault()
                                                        }
                                                    >
                                                        Seach on Block Explorer
                                                    </span>
                                                </center>
                                            </Fragment>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <BottomBar darkMode={darkMode} />
                </div>
            </div>
        );
    }
}
