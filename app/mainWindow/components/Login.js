// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { ipcRenderer } from "electron";
import ReactLoading from "react-loading";
import { session, eventEmitter, loginCounter, il8n, config } from "../index";
import Redirector from "./Redirector";
import SyncReminder from "./SyncReminder";
import Modal from "./Modal";
import { uiType } from "../utils/utils";

type Props = {};

type State = {
    darkMode: boolean,
    walletFile: string,
    wrongPassword: boolean,
    loginInProgress: boolean
};

export default class Login extends Component<Props, State> {
    props: Props;

    constructor(props?: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode || false,
            walletFile: config.walletFile,
            wrongPassword: loginCounter.lastLoginAttemptFailed,
            loginInProgress: false
        };
        const { wrongPassword } = this.state;
        if (!wrongPassword && !session.wallet) {
            this.switchAnimation();
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleBackendMessage = this.handleBackendMessage.bind(this);
    }

    componentDidMount() {
        loginCounter.navBarCount = 0;
        ipcRenderer.on("fromBackend", this.handleBackendMessage);
    }

    componentWillUnmount() {
        ipcRenderer.off("fromBackend", this.handleBackendMessage);
    }

    handleBackendMessage = (event: Electron.IpcRendererEvent, message: any) => {
        const { messageType, data } = message;
        if (messageType === "authenticationStatus") {
            loginCounter.isLoggedIn = data;
            loginCounter.lastLoginAttemptFailed = !data;
            loginCounter.loginFailed = !data;
            eventEmitter.emit("goHome");
        }
        if (messageType === "authenticationError") {
            this.setState({
                loginInProgress: false
            });
        }
    };

    switchAnimation() {
        loginCounter.userLoginAttempted = true;
    }

    handleSubmit = async (event: any) => {
        event.preventDefault();
        this.setState({
            loginInProgress: true
        });
        loginCounter.loginsAttempted++;
        const password = event.target[0].value;
        if (password === undefined) {
            return;
        }
        if (!loginCounter.walletActive) {
            ipcRenderer.send("fromFrontend", "walletPassword", password);
        } else {
            ipcRenderer.send("fromFrontend", "verifyWalletPassword", password);
        }
    };

    render() {
        const {
            darkMode,
            wrongPassword,
            walletFile,
            loginInProgress
        } = this.state;
        const { backgroundColor, fillColor, textColor } = uiType(darkMode);
        return (
            <div>
                <Redirector />
                <Modal darkMode={darkMode} />
                <div className={`fullwindow ${backgroundColor}`}>
                    <div className="mid-div">
                        <div
                            className={
                                wrongPassword &&
                                loginCounter.loginsAttempted > 0
                                    ? `box loginbox-fail inner-div ${fillColor}`
                                    : `box loginbox inner-div ${fillColor}`
                            }
                        >
                            <form onSubmit={this.handleSubmit}>
                                {!loginInProgress && (
                                    <div>
                                        <div className="field">
                                            <label
                                                className={`label ${textColor}`}
                                                htmlFor="scanheight"
                                            >
                                                {il8n.password}
                                                <div className="control">
                                                    <input
                                                        ref={input =>
                                                            input &&
                                                            input.focus()
                                                        }
                                                        className={
                                                            wrongPassword
                                                                ? "input is-large is-danger"
                                                                : "input is-large"
                                                        }
                                                        type="password"
                                                        placeholder={
                                                            il8n.password_input_placeholder
                                                        }
                                                    />
                                                </div>
                                            </label>
                                            <label
                                                className={`help ${textColor}`}
                                                htmlFor="scanheight"
                                            >
                                                {loginCounter.walletActive
                                                    ? il8n.currently_logged_in
                                                    : il8n.attempting_login_to}
                                                <b>{walletFile}</b>
                                            </label>
                                        </div>
                                        <div className="columns">
                                            <div className="column">
                                                {loginCounter.walletActive && (
                                                    <SyncReminder
                                                        className="syncreminder"
                                                        darkMode={darkMode}
                                                    />
                                                )}
                                            </div>
                                            <div className="column">
                                                <div className="buttons is-right">
                                                    <button
                                                        type="submit"
                                                        className="button is-success is-large"
                                                    >
                                                        {session.wallet
                                                            ? il8n.unlock
                                                            : il8n.login}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {loginInProgress && (
                                    <center>
                                        <ReactLoading
                                            type="spinningBubbles"
                                            color={
                                                darkMode ? "#F5F5F5" : "#0A0A0A"
                                            }
                                            height={170}
                                            width={170}
                                        />
                                    </center>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
