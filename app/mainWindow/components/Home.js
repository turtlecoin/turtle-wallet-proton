// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import log from "electron-log";
import { remote, ipcRenderer } from "electron";
import React, { Component, Fragment } from "react";
import ReactTooltip from "react-tooltip";
import { session, eventEmitter, il8n, loginCounter, config } from "../index";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import {
    uiType,
    formatLikeCurrency,
    atomicToHuman,
    convertTimestamp
} from "../utils/utils";
import Configure from "../../configure";

let displayedTransactionCount: number = 50;

type Props = {};

type State = {
    transactions: Array<any>,
    transactionCount: number,
    darkMode: boolean,
    displayCurrency: string,
    fiatPrice: number,
    fiatSymbol: string,
    symbolLocation: string,
    fiatDecimals: number,
    pageAnimationIn: string,
    expandedRows: string[],
    networkBlockHeight: number
};

export default class Home extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props?: Props) {
        super(props);
        this.state = {
            transactions: undefined,
            transactionCount: session.getTransactionCount(),
            darkMode: config.darkMode,
            displayCurrency: config.displayCurrency,
            fiatPrice: session.fiatPrice,
            fiatSymbol: config.fiatSymbol,
            symbolLocation: config.symbolLocation,
            fiatDecimals: config.fiatDecimals,
            pageAnimationIn: loginCounter.getAnimation("/"),
            expandedRows: [],
            networkBlockHeight: session.getNetworkBlockHeight()
        };
        this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
            this
        );
        this.openNewWallet = this.openNewWallet.bind(this);
        this.modifyCurrency = this.modifyCurrency.bind(this);
        this.expandRow = this.expandRow.bind(this);
        this.openInExplorer = this.openInExplorer.bind(this);
        this.handleNewSyncStatus = this.handleNewSyncStatus.bind(this);
        this.handleNewTransactions = this.handleNewTransactions.bind(this);
        this.handleNewTransactionCount = this.handleNewTransactionCount.bind(
            this
        );
    }

    async componentWillMount() {
        try {
            const get_tx = await session.getTransactions();
            this.setState({ transactions: get_tx });
        } catch (err) {
            log.debug(err);
        }
    }

    componentDidMount() {
        eventEmitter.on("openNewWallet", this.openNewWallet);
        eventEmitter.on("gotSyncStatus", this.handleNewSyncStatus);
        eventEmitter.on("gotFiatPrice", this.updateFiatPrice);
        eventEmitter.on("modifyCurrency", this.modifyCurrency);
        eventEmitter.on("gotTransactionCount", this.handleNewTransactionCount);
        eventEmitter.on("gotNewTransactions", this.handleNewTransactions);
        const { loginFailed, firstLoadOnLogin } = session;
        if (firstLoadOnLogin && loginFailed === false) {
            this.switchOffAnimation();
        }
    }

    componentWillUnmount() {
        displayedTransactionCount = 50;
        eventEmitter.off("gotSyncStatus", this.handleNewSyncStatus);
        eventEmitter.off("openNewWallet", this.openNewWallet);
        eventEmitter.off("gotFiatPrice", this.updateFiatPrice);
        eventEmitter.off("modifyCurrency", this.modifyCurrency);
        eventEmitter.off("gotTransactionCount", this.handleNewTransactionCount);
        eventEmitter.off("gotNewTransactions", this.handleNewTransactions);
    }

    handleNewTransactionCount = () => {
        this.setState({
            transactionCount: session.getTransactionCount()
        });
    };

    handleNewTransactions = async () => {
        const get_tx = await session.getTransactions();
        this.setState({ transactions: get_tx });
    };

    handleNewSyncStatus = () => {
        this.setState({
            networkBlockHeight: session.getNetworkBlockHeight()
        });
    };

    openInExplorer = (event: any) => {
        const hash = event.target.value;

        remote.shell.openExternal(
            `${
                Configure.explorerURL
            }/transaction.html?hash=${encodeURIComponent(hash)}`
        );
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

    switchOffAnimation() {
        session.firstLoadOnLogin = false;
    }

    refreshListOnNewTransaction = async () => {
        log.debug("Transaction found, refreshing transaction list...");
        displayedTransactionCount += 1;
        const get_tx = await session.getTransactions(
            0,
            displayedTransactionCount,
            false
        );
        this.setState({ transactions: get_tx });
    };

    openNewWallet = async () => {
        log.debug(
            "Initialized new wallet session, refreshing transaction list..."
        );
        displayedTransactionCount = 50;
        const get_tx = await session.getTransactions(
            0,
            displayedTransactionCount,
            false
        );
        this.setState({ transactions: get_tx });
    };

    // TODO: implement paging instead of just loading +50
    handleLoadMore = (event: any) => {
        event.preventDefault();
        displayedTransactionCount += 50;
        ipcRenderer.send(
            "fromFrontend",
            "transactionRequest",
            displayedTransactionCount
        );
    };

    resetDefault = (event: any) => {
        event.preventDefault();
        displayedTransactionCount = 50;
        ipcRenderer.send(
            "fromFrontend",
            "transactionRequest",
            displayedTransactionCount
        );
    };

    expandRow = (event: any) => {
        const transactionHash = event.target.value;
        const { expandedRows } = this.state;
        if (!expandedRows.includes(transactionHash)) {
            expandedRows.push(transactionHash);
        } else {
            const index = expandedRows.indexOf(transactionHash);
            if (index > -1) {
                expandedRows.splice(index, 1);
            }
        }
        this.setState({
            expandedRows
        });
    };

    render() {
        const {
            darkMode,
            transactions,
            transactionCount,
            fiatPrice,
            displayCurrency,
            fiatSymbol,
            symbolLocation,
            fiatDecimals,
            pageAnimationIn,
            expandedRows,
            networkBlockHeight
        } = this.state;
        const {
            backgroundColor,
            textColor,
            tableMode,
            toolTipColor,
            elementBaseColor,
            fillColor
        } = uiType(darkMode);
        return (
            <div>
                <Redirector />
                <div className={`wholescreen ${backgroundColor}`}>
                    <ReactTooltip
                        effect="solid"
                        type={toolTipColor}
                        multiline
                        place="top"
                    />
                    <NavBar darkMode={darkMode} />
                    <div
                        className={`maincontent-homescreen ${backgroundColor} ${pageAnimationIn}`}
                    >
                        <table
                            className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
                        >
                            <thead>
                                <tr>
                                    <th />
                                    <th className={textColor}>{il8n.date}</th>
                                    <th className={textColor}>{il8n.hash}</th>
                                    <th
                                        className={`has-text-right ${textColor}`}
                                    >
                                        {il8n.amount}
                                    </th>
                                    <th
                                        className={`has-text-right ${textColor}`}
                                    >
                                        {il8n.balance}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions !== undefined &&
                                    transactions.length > 0 &&
                                    transactions.map(tx => {
                                        const [
                                            timestamp,
                                            hash,
                                            amount,
                                            balance
                                        ] = tx;

                                        const rowIsExpanded = expandedRows.includes(
                                            hash
                                        );
                                        const transactionHash = hash;
                                        const toggleSymbol = rowIsExpanded
                                            ? "-"
                                            : "+";

                                        if (amount == 0) {
                                            return null;
                                        }

                                        return (
                                            <Fragment key={transactionHash}>
                                                <tr>
                                                    <td>
                                                        <button
                                                            value={
                                                                transactionHash
                                                            }
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
                                                                    `-${fiatSymbol}${formatLikeCurrency(
                                                                        (
                                                                            fiatPrice *
                                                                            atomicToHuman(
                                                                                amount,
                                                                                false
                                                                            )
                                                                        ).toFixed(
                                                                            fiatDecimals
                                                                        )
                                                                    ).substring(
                                                                        1
                                                                    )}`}
                                                                {displayCurrency ===
                                                                    "fiat" &&
                                                                    symbolLocation ===
                                                                        "suffix" &&
                                                                    fiatPrice !==
                                                                        0 &&
                                                                    `-${formatLikeCurrency(
                                                                        (
                                                                            fiatPrice *
                                                                            atomicToHuman(
                                                                                amount,
                                                                                false
                                                                            )
                                                                        ).toFixed(
                                                                            2
                                                                        )
                                                                    ).substring(
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
                                                    <td>
                                                        <p className="has-text-right">
                                                            {displayCurrency ===
                                                                Configure.ticker &&
                                                                atomicToHuman(
                                                                    balance,
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
                                                                            balance,
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
                                                                            balance,
                                                                            false
                                                                        )
                                                                    ).toFixed(
                                                                        fiatDecimals
                                                                    )
                                                                )}${fiatSymbol}`}
                                                        </p>
                                                    </td>
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
                                                                                      networkBlockHeight -
                                                                                          tx[4],
                                                                                      0
                                                                                  )
                                                                                : 0}
                                                                            <br />
                                                                            {timestamp ===
                                                                            0
                                                                                ? "Still In Memory Pool"
                                                                                : formatLikeCurrency(
                                                                                      tx[4]
                                                                                  )}
                                                                            <br />
                                                                            {
                                                                                tx[8]
                                                                            }{" "}
                                                                            <br />
                                                                            {
                                                                                hash
                                                                            }{" "}
                                                                            <br />
                                                                            {tx[5] !==
                                                                            ""
                                                                                ? tx[5]
                                                                                : "none"}
                                                                            <br />
                                                                            {atomicToHuman(
                                                                                tx[7],
                                                                                true
                                                                            )}{" "}
                                                                            {
                                                                                Configure.ticker
                                                                            }
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
                                                                                {
                                                                                    Configure.ticker
                                                                                }
                                                                            </p>
                                                                            <br />
                                                                            <br />
                                                                            <button
                                                                                className={`button ${elementBaseColor}`}
                                                                                value={
                                                                                    transactionHash
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
                        {transactions !== undefined &&
                            transactions.length === 0 && (
                                <div className="elem-to-center">
                                    <div className={`box ${fillColor}`}>
                                        <p
                                            className={`${textColor} title has-text-centered`}
                                        >
                                            <i className="fas fa-robot" />
                                            &nbsp;&nbsp;Welcome to TurtleCoin
                                            Wallet!
                                        </p>
                                        <br />
                                        <p
                                            className={`${textColor} subtitle has-text-centered`}
                                        >
                                            You don&apos;t have any transactions
                                            yet. They will display here once you
                                            do.
                                        </p>
                                    </div>
                                </div>
                            )}
                        {transactions !== undefined &&
                            transactions.length > displayedTransactionCount && (
                                <form>
                                    <div className="field">
                                        <div className="buttons">
                                            <button
                                                type="submit"
                                                className="button is-warning"
                                                onClick={this.handleLoadMore}
                                            >
                                                {il8n.load_more}
                                            </button>
                                            <button
                                                type="submit"
                                                className="button is-danger"
                                                onClick={this.resetDefault}
                                            >
                                                {il8n.reset}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                    </div>
                    <BottomBar darkMode={darkMode} />
                </div>
            </div>
        );
    }
}
