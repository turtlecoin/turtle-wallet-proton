// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { clipboard, remote } from "electron";
import Configure from "../../configure";
import log from "electron-log";
import jdenticon from "jdenticon";
import { WalletBackend, Daemon } from "turtlecoin-wallet-backend";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import { uiType } from "../utils/utils";
import { backupToFile, eventEmitter, reInitWallet, config } from "../index";

type State = {
    darkMode: boolean,
    newWallet: any,
    password: string,
    confirmPassword: string,
    confirmSeed: string,
    activePage: string,
    showPassword: boolean,
    MnemonicSeed: string
};

type Props = {};

export default class NewWallet extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            darkMode: config.darkMode,
            newWallet: undefined,
            activePage: "generate",
            password: "",
            confirmPassword: "",
            confirmSeed: "",
            showPassword: false,
            MnemonicSeed: ""
        };

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
            this
        );
        this.handleConfirmSeedChange = this.handleConfirmSeedChange.bind(this);
        this.toggleShowPassword = this.toggleShowPassword.bind(this);
        this.ref = null;
        this.handleCopiedTip = this.handleCopiedTip.bind(this);
    }

    async componentDidMount() {}

    async componentWillMount() {
        try {
            const wallet = await WalletBackend.createWallet(
                Configure.defaultDaemon,
                Configure
            );
            const seed = await wallet.getMnemonicSeed();
            this.setState({ newWallet: wallet, MnemonicSeed: seed });
        } catch (err) {
            log.debug(err);
        }
    }

    componentDidUpdate() {}

    componentWillUnmount() {}

    toggleShowPassword() {
        const { showPassword } = this.state;

        this.setState({
            showPassword: !showPassword
        });
    }

    evaluatePageNumber = (pageName: string) => {
        switch (pageName) {
            default:
                log.error("Programmer error!");
                break;
            case "generate":
                return 1;
            case "secure":
                return 2;
            case "backup":
                return 3;
            case "verify":
                return 4;
        }
    };

    evaluatePageName = (pageNumber: number) => {
        switch (pageNumber) {
            default:
                log.error("Programmer error!");
                break;
            case 1:
                return "generate";
            case 2:
                return "secure";
            case 3:
                return "backup";
            case 4:
                return "verify";
        }
    };

    handleCopiedTip = () => {
        ReactTooltip.show(this.ref);
        setTimeout(() => {
            ReactTooltip.hide(this.ref);
        }, 500);
    };

    prevPage = () => {
        const { activePage } = this.state;
        let currentPageNumber: number = this.evaluatePageNumber(activePage);

        if (currentPageNumber === 1) {
            return;
        }

        currentPageNumber--;
        const newPageName = this.evaluatePageName(currentPageNumber);

        this.setState({
            activePage: newPageName
        });
    };

    nextPage = async () => {
        const {
            darkMode,
            newWallet,
            activePage,
            password,
            confirmPassword,
            confirmSeed,
            showPassword,
            MnemonicSeed
        } = this.state;
        const { textColor } = uiType(darkMode);
        let currentPageNumber: number = this.evaluatePageNumber(activePage);

        if (currentPageNumber === 4) {
            // import the seed so we can confirm it works
            const [
                confirmWallet,
                err
            ] = await WalletBackend.importWalletFromSeed(
                Configure.defaultDaemon,
                100000,
                confirmSeed,
                Configure
            );

            // the seed wasn't valid
            if (err) {
                log.error(err);
                const message = (
                    <div>
                        <center>
                            <p className="title has-text-danger">
                                Seed Verification Error!
                            </p>
                        </center>
                        <br />
                        <p className={`subtitle ${textColor}`}>
                            {err.customMessage}
                        </p>
                    </div>
                );
                eventEmitter.emit("openModal", message, "OK", null, null);
            }

            // seed was valid, let's check if it's the same address
            if (confirmWallet) {
                // if the addresses match, seeds match
                if (
                    confirmWallet.getPrimaryAddress() ===
                    newWallet.getPrimaryAddress()
                ) {
                    // get the save as path
                    const options = {
                        defaultPath: remote.app.getPath("documents"),
                        filters: [
                            {
                                name: "TurtleCoin Wallet File (v0)",
                                extensions: ["wallet"]
                            }
                        ]
                    };
                    const response = await remote.dialog.showSaveDialog(
                        null,
                        options
                    );
                    if (response.canceled) {
                        return;
                    }
                    const saved = newWallet.saveWalletToFile(
                        `${response.filePath}`,
                        password
                    );
                    if (saved) {
                        reInitWallet(`${response.filePath}`);
                    } else {
                        const message = (
                            <div>
                                <center>
                                    <p className="subtitle has-text-danger">
                                        Wallet Save Error!
                                    </p>
                                </center>
                                <br />
                                <p className={`subtitle ${textColor}`}>
                                    The wallet was not saved successfully. Check
                                    your directory permissions and try again.
                                </p>
                            </div>
                        );
                        eventEmitter.emit(
                            "openModal",
                            message,
                            "OK",
                            null,
                            null
                        );
                    }
                } else {
                    log.error("Wallet creation error.");
                    const message = (
                        <div>
                            <center>
                                <p className="title has-text-danger">
                                    Wallet Creation Error!
                                </p>
                            </center>
                            <br />
                            <p className={`subtitle ${textColor}`}>
                                The seed you input did not match the seed of the
                                new wallet. Try again.
                            </p>
                        </div>
                    );
                    eventEmitter.emit("openModal", message, "OK", null, null);
                }
            }
            return;
        }

        if (currentPageNumber === 2 && password !== confirmPassword) {
            return;
        }

        currentPageNumber++;
        const newPageName = this.evaluatePageName(currentPageNumber);

        this.setState({
            activePage: newPageName
        });
    };

    handlePasswordChange(event: any) {
        const password = event.target.value;

        this.setState({
            password
        });
    }

    handleConfirmSeedChange(event: any) {
        const confirmSeed = event.target.value;

        this.setState({
            confirmSeed
        });
    }

    handleConfirmPasswordChange(event: any) {
        const confirmPassword = event.target.value;

        this.setState({
            confirmPassword
        });
    }

    render() {
        if (this.state.newWallet !== undefined) {
            // render child component that depends on async data
            const {
                darkMode,
                newWallet,
                activePage,
                password,
                confirmPassword,
                confirmSeed,
                showPassword,
                MnemonicSeed
            } = this.state;
            const {
                backgroundColor,
                fillColor,
                elementBaseColor,
                textColor
            } = uiType(darkMode);

            const copiedTip = "Copied!";
            return (
                <div>
                    <Redirector />
                    <div className={`wholescreen ${fillColor} hide-scrollbar`}>
                        <NavBar darkMode={darkMode} />
                        <div className={`maincontent ${backgroundColor}`}>
                            <div
                                className={`steps ${textColor} is-dark`}
                                id="stepsDemo"
                            >
                                <div
                                    className={`step-item ${
                                        activePage === "generate"
                                            ? "is-active"
                                            : ""
                                    } ${
                                        this.evaluatePageNumber(activePage) > 1
                                            ? "is-completed"
                                            : ""
                                    } is-success`}
                                >
                                    <div className="step-marker">
                                        {this.evaluatePageNumber(activePage) >
                                        1 ? (
                                            <i className="fas fa-check" />
                                        ) : (
                                            "1"
                                        )}
                                    </div>
                                    <div className="step-details">
                                        <p className="step-title">Generate</p>
                                    </div>
                                </div>
                                <div
                                    className={`step-item ${
                                        activePage === "secure"
                                            ? "is-active"
                                            : ""
                                    } ${
                                        this.evaluatePageNumber(activePage) > 2
                                            ? "is-completed"
                                            : ""
                                    } is-success`}
                                >
                                    <div className="step-marker">
                                        {" "}
                                        {this.evaluatePageNumber(activePage) >
                                        2 ? (
                                            <i className="fas fa-check" />
                                        ) : (
                                            "2"
                                        )}
                                    </div>
                                    <div className="step-details">
                                        <p className="step-title">Secure</p>
                                    </div>
                                </div>
                                <div
                                    className={`step-item ${
                                        activePage === "backup"
                                            ? "is-active"
                                            : ""
                                    } ${
                                        this.evaluatePageNumber(activePage) > 3
                                            ? "is-completed"
                                            : ""
                                    } is-success`}
                                >
                                    <div className="step-marker">
                                        {" "}
                                        {this.evaluatePageNumber(activePage) >
                                        3 ? (
                                            <i className="fas fa-check" />
                                        ) : (
                                            "3"
                                        )}
                                    </div>
                                    <div className="step-details">
                                        <p className="step-title">Backup</p>
                                    </div>
                                </div>
                                <div
                                    className={`step-item ${
                                        activePage === "verify"
                                            ? "is-active"
                                            : ""
                                    } is-success`}
                                >
                                    <div className="step-marker">4</div>
                                    <div className="step-details">
                                        <p className="step-title">Verify</p>
                                    </div>
                                </div>
                            </div>

                            {activePage === "generate" && (
                                <div>
                                    <p className={`subtitle ${textColor}`}>
                                        Welcome to the wallet creation wizard.
                                        Each address is randomly generated.
                                    </p>
                                    <div className="columns">
                                        <div className="column">
                                            <p className={`${textColor} label`}>
                                                Your New Address:
                                                <textarea
                                                    className="textarea is-large no-resize is-family-monospace"
                                                    rows="4"
                                                    readOnly
                                                    value={newWallet.getPrimaryAddress()}
                                                />
                                            </p>
                                        </div>
                                        <div className="column is-one-fifth">
                                            <span
                                                className={`label ${textColor}`}
                                            >
                                                Identicon:
                                                <center>
                                                    <div className="box">
                                                        <span
                                                            // eslint-disable-next-line react/no-danger
                                                            dangerouslySetInnerHTML={{
                                                                __html: jdenticon.toSvg(
                                                                    newWallet.getPrimaryAddress(),
                                                                    130
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                </center>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activePage === "secure" && (
                                <div>
                                    <p className={`subtitle ${textColor}`}>
                                        Set a password for your wallet. Take
                                        care not to forget it.
                                    </p>
                                    <div className="field">
                                        <label
                                            className={`label ${textColor}`}
                                            htmlFor="scanheight"
                                        >
                                            Enter a Password:
                                            <div className="control">
                                                <input
                                                    className="input is-large"
                                                    type={
                                                        showPassword
                                                            ? "input"
                                                            : "password"
                                                    }
                                                    placeholder="Enter a password"
                                                    value={password}
                                                    onChange={
                                                        this
                                                            .handlePasswordChange
                                                    }
                                                    onKeyPress={event => {
                                                        if (
                                                            event.key ===
                                                            "Enter"
                                                        ) {
                                                            this.nextPage();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </label>
                                    </div>
                                    <div className="field">
                                        <label
                                            className={`label ${textColor}`}
                                            htmlFor="scanheight"
                                        >
                                            Confirm Password:{" "}
                                            {password !== confirmPassword ? (
                                                <span className="has-text-danger">
                                                    &nbsp;&nbsp;Passwords do not
                                                    match!
                                                </span>
                                            ) : (
                                                ""
                                            )}
                                            <div className="control">
                                                <input
                                                    className="input is-large"
                                                    type={
                                                        showPassword
                                                            ? "input"
                                                            : "password"
                                                    }
                                                    placeholder="Confirm password"
                                                    value={confirmPassword}
                                                    onChange={
                                                        this
                                                            .handleConfirmPasswordChange
                                                    }
                                                    onKeyPress={event => {
                                                        if (
                                                            event.key ===
                                                            "Enter"
                                                        ) {
                                                            this.nextPage();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </label>
                                    </div>
                                    {showPassword === false && (
                                        <span className={textColor}>
                                            <a
                                                className="button is-danger"
                                                onClick={
                                                    this.toggleShowPassword
                                                }
                                                onKeyPress={
                                                    this.toggleShowPassword
                                                }
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <span className="icon is-large">
                                                    <i className="fas fa-times" />
                                                </span>
                                            </a>
                                            &nbsp;&nbsp; Show Password:{" "}
                                            <b>Off</b>
                                        </span>
                                    )}
                                    {showPassword === true && (
                                        <span className={textColor}>
                                            <a
                                                className="button is-success"
                                                onClick={
                                                    this.toggleShowPassword
                                                }
                                                onKeyPress={
                                                    this.toggleShowPassword
                                                }
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <span className="icon is-large">
                                                    <i className="fa fa-check" />
                                                </span>
                                            </a>
                                            &nbsp;&nbsp; Show Password:{" "}
                                            <b>On</b> &nbsp;&nbsp;
                                        </span>
                                    )}
                                </div>
                            )}

                            {activePage === "backup" && (
                                <div>
                                    <p className={`subtitle ${textColor}`}>
                                        Please back up the following mnemonic
                                        seed safely.{" "}
                                        <span className="has-text-danger has-text-weight-bold ">
                                            If you lose it your funds will be
                                            lost forever.
                                        </span>
                                    </p>
                                    <p className={`label ${textColor}`}>
                                        Mnemonic Seed:
                                        <textarea
                                            className="textarea no-resize is-large"
                                            value={MnemonicSeed[0]}
                                            rows="4"
                                            readOnly
                                        />
                                    </p>
                                    <button
                                        // eslint-disable-next-line no-return-assign
                                        ref={ref => (this.ref = ref)}
                                        type="button"
                                        className={`button ${elementBaseColor}`}
                                        onClick={() => {
                                            clipboard.writeText(
                                                MnemonicSeed[0]
                                            );
                                            this.handleCopiedTip();
                                        }}
                                        data-tip={copiedTip}
                                        data-event="none"
                                        data-effect="float"
                                    >
                                        <span className="icon">
                                            <i className="fa fa-clipboard" />
                                        </span>
                                        &nbsp;&nbsp;Copy to Clipboard
                                    </button>
                                    &nbsp;&nbsp;
                                    <button
                                        type="button"
                                        className={`button ${elementBaseColor}`}
                                        onClick={() => {
                                            backupToFile(newWallet);
                                        }}
                                    >
                                        <span className="icon">
                                            <i className="fas fa-save" />
                                        </span>
                                        &nbsp;&nbsp;Save To File
                                    </button>
                                </div>
                            )}

                            {activePage === "verify" && (
                                <div>
                                    <p className={`subtitle ${textColor}`}>
                                        Enter your seed to confirm you&apos;ve
                                        backed it up.
                                    </p>
                                    <p className={`label ${textColor}`}>
                                        Confirm Seed:
                                        <textarea
                                            className="textarea no-resize is-large"
                                            value={confirmSeed}
                                            onChange={
                                                this.handleConfirmSeedChange
                                            }
                                            rows="4"
                                            onKeyPress={event => {
                                                if (event.key === "Enter") {
                                                    this.nextPage();
                                                }
                                            }}
                                        />
                                    </p>
                                </div>
                            )}

                            <br />
                            <center>
                                <div className="buttons bottombuttons">
                                    <span
                                        className="button is-warning is-large"
                                        onClick={this.prevPage}
                                        onKeyPress={this.prevPage}
                                        role="button"
                                        tabIndex={0}
                                        onMouseDown={event =>
                                            event.preventDefault()
                                        }
                                    >
                                        Back
                                    </span>
                                    &nbsp;&nbsp;
                                    <span
                                        className="button is-success is-large"
                                        onClick={this.nextPage}
                                        onKeyPress={this.nextPage}
                                        role="button"
                                        tabIndex={0}
                                        onMouseDown={event =>
                                            event.preventDefault()
                                        }
                                    >
                                        {activePage === "verify"
                                            ? "Save Wallet As"
                                            : "Next"}
                                    </span>
                                </div>
                            </center>
                        </div>
                        <BottomBar darkMode={darkMode} />
                    </div>
                </div>
            );
        } else {
            // initial render
            return <div>Loading..</div>;
        }
    }
}
