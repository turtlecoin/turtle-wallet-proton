// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { uiType } from "../utils/utils";
import { eventEmitter } from "../index";

type State = {
    isActive: string,
    message: any,
    confirmLabel: string,
    denyLabel: string,
    confirmAction: string,
    extraLabel?: string,
    extraAction?: string
};

type Props = {
    darkMode: boolean
};

export default class Modal extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isActive: "",
            message: "",
            confirmLabel: "",
            denyLabel: "",
            confirmAction: "",
            extraLabel: "",
            extraAction: ""
        };
        this.closeModal = this.closeModal.bind(this);
        this.openModal = this.openModal.bind(this);
        this.confirmModal = this.confirmModal.bind(this);
        this.extraAction = this.extraAction.bind(this);
        this.handleEsc = this.handleEsc.bind(this);
    }

    componentWillMount() {
        eventEmitter.on("openModal", this.openModal);
        eventEmitter.on("closeModal", this.closeModal);
    }

    componentWillUnmount() {
        eventEmitter.off("openModal", this.openModal);
        eventEmitter.off("closeModal", this.closeModal);
    }

    closeModal = () => {
        this.setState({
            isActive: ""
        });
    };

    handleEsc = (event: any) => {
        if (event.key === "Escape") {
            this.closeModal();
        }
    };

    confirmModal = () => {
        this.closeModal();
        const { confirmAction } = this.state;
        eventEmitter.emit(confirmAction);
    };

    extraAction = () => {
        this.closeModal();
        const { extraAction } = this.state;
        if (!extraAction) {
            return;
        }
        eventEmitter.emit(extraAction);
    };

    openModal = (
        message: string,
        confirmLabel: string,
        denyLabel: string,
        confirmAction: string,
        extraLabel?: string,
        extraAction?: string
    ) => {
        this.setState({
            isActive: "is-active",
            message,
            confirmLabel,
            denyLabel,
            confirmAction,
            extraLabel: extraLabel !== "" ? extraLabel : "",
            extraAction: extraAction !== "" ? extraAction : ""
        });
    };

    render() {
        const { darkMode } = this.props;
        const {
            isActive,
            message,
            confirmLabel,
            denyLabel,
            extraLabel
        } = this.state;
        const { backgroundColor } = uiType(darkMode);

        return (
            <div
                className={`modal ${isActive} fadein`}
                onKeyDown={event => this.handleEsc(event)}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
            >
                <div
                    className="modal-background"
                    onClick={this.closeModal}
                    onKeyPress={this.closeModal}
                    role="button"
                    type="button"
                    tabIndex={0}
                    onMouseDown={event => event.preventDefault()}
                />
                <div className="modal-content">
                    <div className={`box ${backgroundColor}`}>
                        {message}
                        <br />
                        <div className="buttons is-right">
                            {confirmLabel && (
                                <button
                                    className="button is-success is-large"
                                    onClick={() => this.confirmModal()}
                                    onKeyPress={() => this.confirmModal()}
                                    type="submit"
                                    tabIndex={0}
                                    onMouseDown={event =>
                                        event.preventDefault()
                                    }
                                    ref={input => input && input.focus()}
                                >
                                    {confirmLabel}
                                </button>
                            )}
                            {extraLabel && (
                                <button
                                    className="button is-warning is-large"
                                    onClick={this.extraAction}
                                    onKeyPress={this.extraAction}
                                    type="button"
                                    tabIndex={0}
                                    onMouseDown={event =>
                                        event.preventDefault()
                                    }
                                >
                                    {extraLabel}
                                </button>
                            )}
                            {denyLabel && (
                                <button
                                    className="button is-danger is-large"
                                    onClick={this.closeModal}
                                    onKeyPress={this.closeModal}
                                    type="button"
                                    tabIndex={0}
                                    onMouseDown={event =>
                                        event.preventDefault()
                                    }
                                >
                                    {denyLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
