// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { ipcRenderer } from "electron";
import { eventEmitter, il8n, loginCounter, config } from "../index";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import { uiType } from "../utils/utils";

type Props = {};

type State = {
    darkMode: boolean,
    pageAnimationIn: string
};

export default class ChangePassword extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props?: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode,
            pageAnimationIn: loginCounter.getAnimation("/changepassword"),
            oldPassword: "",
            newPassword: "",
            passwordConfirm: ""
        };
        this.changePassword = this.changePassword.bind(this);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    changePassword = () => {
        const {
            oldPassword,
            newPassword,
            passwordConfirm,
            darkMode
        } = this.state;
        const { textColor } = uiType(darkMode);
        console.log(this.state);
        if (newPassword !== passwordConfirm) {
            const message = (
                <div>
                    <center>
                        <p className="title has-text-danger">
                            Password Do Not Match!
                        </p>
                    </center>
                    <br />
                    <p className={`subtitle ${textColor}`}>
                        The passwords you entered were not the same. Try again.
                    </p>
                </div>
            );
            eventEmitter.emit("openModal", message, "OK", null, null);
            return;
        }
        const request = { oldPassword, newPassword };
        ipcRenderer.send("fromFrontend", "changePasswordRequest", request);
    };

    render() {
        const {
            darkMode,
            pageAnimationIn,
            oldPassword,
            newPassword,
            passwordConfirm
        } = this.state;
        const { backgroundColor, fillColor, textColor } = uiType(darkMode);

        return (
            <div>
                <Redirector />
                <div className={`wholescreen ${fillColor}`}>
                    <NavBar darkMode={darkMode} />
                    <div
                        className={`maincontent ${backgroundColor} ${pageAnimationIn}`}
                    >
                        <div className="field">
                            <label
                                className={`label ${textColor}`}
                                htmlFor="scanheight"
                            >
                                {il8n.change_passwd_enter_current_passwd}
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="password"
                                        placeholder={
                                            il8n.change_passwd_enter_current_passwd_input_placeholder
                                        }
                                        value={oldPassword}
                                        onChange={event => {
                                            this.setState({
                                                oldPassword: event.target.value
                                            });
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
                                {il8n.change_passwd_enter_new_passwd}
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="password"
                                        placeholder={
                                            il8n.change_passwd_enter_new_passwd_input_placeholder
                                        }
                                        value={newPassword}
                                        onChange={event => {
                                            this.setState({
                                                newPassword: event.target.value
                                            });
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
                                {il8n.change_passwd_confirm_new_passwd}
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="password"
                                        placeholder={
                                            il8n.change_passwd_confirm_new_passwd_input_placeholder
                                        }
                                        value={passwordConfirm}
                                        onChange={event => {
                                            this.setState({
                                                passwordConfirm:
                                                    event.target.value
                                            });
                                        }}
                                    />
                                </div>
                            </label>
                        </div>
                        <div className="buttons is-right">
                            <button
                                type="submit"
                                className="button is-success is-large"
                                onClick={this.changePassword}
                            >
                                {il8n.change}
                            </button>
                        </div>
                    </div>
                    <BottomBar darkMode={darkMode} />
                </div>
            </div>
        );
    }
}
