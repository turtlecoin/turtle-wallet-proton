// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { remote } from "electron";
import log from "electron-log";
import { WalletBackend, Daemon } from "turtlecoin-wallet-backend";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import { uiType } from "../utils/utils";
import { eventEmitter, reInitWallet, config } from "../index";
import Configure from "../../configure";
import iConfig from "../constants/config.json";

type State = {
    darkMode: boolean,
    password: string,
    confirmPassword: string,
    confirmSeed: string,
    activePage: string,
    showPassword: boolean,
    darkMode: boolean,
    mnemonicSeed: string,
    importedWallet: WalletBackend | null,
    scanHeight: string
};

type Props = {};

export default class Import extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode,
            activePage: "enter_seed",
            password: "",
            confirmPassword: "",
            mnemonicSeed: "",
            scanHeight: "",
            showPassword: false,
            importedWallet: null
        };

        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
            this
        );
        this.toggleShowPassword = this.toggleShowPassword.bind(this);
        this.ref = null;
        this.handleCopiedTip = this.handleCopiedTip.bind(this);
    }

    componentWillMount() {}

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
            case "enter_seed":
                return 1;
            case "verify":
                return 2;
            case "secure":
                return 3;
        }
    };

    evaluatePageName = (pageNumber: number) => {
        switch (pageNumber) {
            default:
                log.error("Programmer error!");
                break;
            case 1:
                return "enter_seed";
            case 2:
                return "verify";
            case 3:
                return "secure";
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
            activePage,
            password,
            confirmPassword,
            mnemonicSeed,
            scanHeight,
            darkMode,
            importedWallet
        } = this.state;
        const { textColor } = uiType(darkMode);
        let currentPageNumber: number = this.evaluatePageNumber(activePage);

        if (currentPageNumber === 1) {
            const [
                restoredWallet,
                error
            ] = await WalletBackend.importWalletFromSeed(
                new Daemon(iConfig.daemonHost, iConfig.daemonPort),
                scanHeight === "" ? 0 : Number(scanHeight),
                mnemonicSeed,
                Configure
            );

            if (error) {
                const message = (
                    <div>
                        <center>
                            <p className="title has-text-danger">
                                Restore Error!
                            </p>
                        </center>
                        <br />
                        <p className={`subtitle ${textColor}`}>
                            The restore was not successful, is your seed
                            correct? Please check your details and try again.
                        </p>
                    </div>
                );
                eventEmitter.emit("openModal", message, "OK", null, null);
                return;
            }
            this.setState({
                importedWallet: restoredWallet
            });
        }

        if (currentPageNumber === 3) {
            if (password !== confirmPassword) {
                return;
            }
            const options = {
                defaultPath: remote.app.getPath("documents"),
                filters: [
                    {
                        name: "TurtleCoin Wallet File (v0)",
                        extensions: ["wallet"]
                    }
                ]
            };
            const response = await remote.dialog.showSaveDialog(null, options);
            if (response.canceled) {
                return;
            }

            const saved = importedWallet.saveWalletToFile(
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
                            The wallet was not saved successfully. Check your
                            directory permissions and try again.
                        </p>
                    </div>
                );
                eventEmitter.emit("openModal", message, "OK", null, null);
            }
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

    handleConfirmPasswordChange(event: any) {
        const confirmPassword = event.target.value;

        this.setState({
            confirmPassword
        });
    }

    render() {
        const {
            darkMode,
            activePage,
            password,
            confirmPassword,
            mnemonicSeed,
            showPassword,
            importedWallet,
            scanHeight
        } = this.state;
        const { backgroundColor, fillColor, textColor } = uiType(darkMode);

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
                                    activePage === "enter_seed"
                                        ? "is-active"
                                        : ""
                                } ${
                                    this.evaluatePageNumber(activePage) > 1
                                        ? "is-completed"
                                        : ""
                                } is-success`}
                            >
                                <div className="step-marker">
                                    {this.evaluatePageNumber(activePage) > 1 ? (
                                        <i className="fas fa-check" />
                                    ) : (
                                        "1"
                                    )}
                                </div>
                                <div className="step-details">
                                    <p className="step-title">Enter Seed</p>
                                </div>
                            </div>
                            <div
                                className={`step-item ${
                                    activePage === "verify" ? "is-active" : ""
                                } ${
                                    this.evaluatePageNumber(activePage) > 2
                                        ? "is-completed"
                                        : ""
                                } is-success`}
                            >
                                <div className="step-marker">
                                    {" "}
                                    {this.evaluatePageNumber(activePage) > 2 ? (
                                        <i className="fas fa-check" />
                                    ) : (
                                        "2"
                                    )}
                                </div>
                                <div className="step-details">
                                    <p className="step-title">Verify</p>
                                </div>
                            </div>
                            <div
                                className={`step-item ${
                                    activePage === "secure" ? "is-active" : ""
                                } ${
                                    this.evaluatePageNumber(activePage) > 3
                                        ? "is-completed"
                                        : ""
                                } is-success`}
                            >
                                <div className="step-marker">
                                    {" "}
                                    {this.evaluatePageNumber(activePage) > 3 ? (
                                        <i className="fas fa-check" />
                                    ) : (
                                        "3"
                                    )}
                                </div>
                                <div className="step-details">
                                    <p className="step-title">Secure</p>
                                </div>
                            </div>
                        </div>

                        {activePage === "enter_seed" && (
                            <div>
                                <p className={`subtitle ${textColor}`}>
                                    Welcome to the wallet import wizard. Please
                                    enter your mnemonic seed.
                                </p>
                                <div>
                                    <label
                                        className={`label ${textColor}`}
                                        htmlFor="seed"
                                    >
                                        Mnemonic Seed:
                                        <textarea
                                            className="textarea is-large"
                                            placeholder="Enter your mnemonic seed"
                                            rows={2}
                                            onChange={event => {
                                                this.setState({
                                                    mnemonicSeed:
                                                        event.target.value
                                                });
                                            }}
                                            onKeyPress={event => {
                                                if (event.key === "Enter") {
                                                    this.nextPage();
                                                }
                                            }}
                                            value={mnemonicSeed}
                                        />
                                    </label>
                                    <label
                                        className={`label ${textColor}`}
                                        htmlFor="scanHeight"
                                    >
                                        Scan Height: (Optional)
                                        <textarea
                                            className="input is-large"
                                            placeholder="0"
                                            rows={4}
                                            onChange={event => {
                                                this.setState({
                                                    scanHeight:
                                                        event.target.value
                                                });
                                            }}
                                            onKeyPress={event => {
                                                if (event.key === "Enter") {
                                                    this.nextPage();
                                                }
                                            }}
                                            value={scanHeight}
                                        />
                                        <p className={`${textColor} help`}>
                                            Optional. Defaults to 0 if
                                            you&apos;re not sure.
                                        </p>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activePage === "verify" && (
                            <div>
                                <p className={`subtitle ${textColor}`}>
                                    Confirm the address below is the one you
                                    expect.{" "}
                                    <span className="has-text-danger has-text-weight-bold ">
                                        If it isn&apos;t correct, go back and
                                        double check your seed.
                                    </span>
                                </p>
                                <p className={`label ${textColor}`}>
                                    Imported Wallet Address:
                                    <textarea
                                        className="textarea no-resize is-large"
                                        value={importedWallet.getPrimaryAddress()}
                                        rows="4"
                                        readOnly
                                    />
                                </p>
                            </div>
                        )}

                        {activePage === "secure" && (
                            <div>
                                <p className={`subtitle ${textColor}`}>
                                    Set a password for your wallet. Take care
                                    not to forget it.
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
                                                    this.handlePasswordChange
                                                }
                                                onKeyPress={event => {
                                                    if (event.key === "Enter") {
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
                                                    if (event.key === "Enter") {
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
                                            onClick={this.toggleShowPassword}
                                            onKeyPress={this.toggleShowPassword}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span className="icon is-large">
                                                <i className="fas fa-times" />
                                            </span>
                                        </a>
                                        &nbsp;&nbsp; Show Password: <b>Off</b>
                                    </span>
                                )}
                                {showPassword === true && (
                                    <span className={textColor}>
                                        <a
                                            className="button is-success"
                                            onClick={this.toggleShowPassword}
                                            onKeyPress={this.toggleShowPassword}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span className="icon is-large">
                                                <i className="fa fa-check" />
                                            </span>
                                        </a>
                                        &nbsp;&nbsp; Show Password: <b>On</b>{" "}
                                        &nbsp;&nbsp;
                                    </span>
                                )}
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
                                    {activePage === "secure"
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
    }
}
