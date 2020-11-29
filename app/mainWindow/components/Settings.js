// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component, Fragment } from "react";
import { ipcRenderer } from "electron";
import log from "electron-log";
import os from "os";
import ReactTooltip from "react-tooltip";
import { eventEmitter, loginCounter, config } from "../index";
import NavBar from "./NavBar";
import BottomBar from "./BottomBar";
import Redirector from "./Redirector";
import FiatSelector from "./FiatSelector";
import TimeSelector from "./TimeSelector";
import TimeoutSelector from "./TimeoutSelector";
import LogLevelSelector from "./LogLevelSelector";
import NodeChanger from "./NodeChanger";
import { uiType } from "../utils/utils";
import Rescanner from "./Rescanner";
import DarkModeToggle from "./DarkModeToggle";
import CloseToTrayToggle from "./CloseToTrayToggle";
import ScanCoinbaseToggle from "./ScanCoinbaseToggle";
import AutoOptimizationToggle from "./AutoOptimizationToggle";
import NotificationsToggle from "./NotificationsToggle";

type Props = {};

type State = {
    darkMode: boolean,
    activeTab: string,
    masterSwitch: boolean,
    inAnimation: string,
    outAnimation: string,
    masterSwitch: boolean,
    previousTab: string,
    pageAnimationIn: string
};

export default class Settings extends Component<Props, State> {
    props: Props;

    state: State;

    menuFocusStack: string[];

    constructor(props?: Props) {
        super(props);
        this.state = {
            darkMode: config.darkMode,
            activeTab: loginCounter.lastSettingsTab,
            previousTab: "",
            inAnimation: "",
            outAnimation: "",
            masterSwitch: false,
            pageAnimationIn: loginCounter.getAnimation("/settings")
        };
        this.darkModeOn = this.darkModeOn.bind(this);
        this.darkModeOff = this.darkModeOff.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.flipMasterSwitch = this.flipMasterSwitch.bind(this);

        const { activeTab, previousTab } = this.state;
        this.menuFocusStack = [activeTab, previousTab];
    }

    componentDidMount() {
        eventEmitter.on("darkmodeon", this.darkModeOn);
        eventEmitter.on("darkmodeoff", this.darkModeOff);
    }

    componentWillUnmount() {
        const { activeTab } = this.state;
        eventEmitter.off("darkmodeon", this.darkModeOn);
        eventEmitter.off("darkmodeoff", this.darkModeOff);
        loginCounter.lastSettingsTab = activeTab;
    }

    darkModeOn = () => {
        this.setState({
            darkMode: true
        });
    };

    darkModeOff = () => {
        this.setState({
            darkMode: false
        });
    };

    flipMasterSwitch = () => {
        this.setState({
            masterSwitch: false
        });
    };

    setActiveTab = (newTab: string) => {
        const { activeTab } = this.state;
        this.setState({
            previousTab: activeTab,
            masterSwitch: true
        });
        this.menuFocusStack.unshift(newTab);
        if (this.menuFocusStack.length > 2) {
            this.menuFocusStack.pop();
        }
        const [requestedPage, previousPage] = this.menuFocusStack;
        if (
            this.evaluatePosition(requestedPage) >
            this.evaluatePosition(previousPage)
        ) {
            this.setState({
                inAnimation: "slide-in-bottom",
                outAnimation: "slide-out-top"
            });
        } else if (
            this.evaluatePosition(requestedPage) <
            this.evaluatePosition(previousPage)
        ) {
            this.setState({
                inAnimation: "slide-in-top",
                outAnimation: "slide-out-bottom"
            });
        } else {
            this.setState({
                inAnimation: "",
                outAnimation: "",
                masterSwitch: false
            });
        }
        this.setState({
            activeTab: newTab
        });
        setTimeout(this.flipMasterSwitch, 250);
    };

    evaluatePosition = (tabName: string) => {
        let tabValue: number;
        switch (tabName) {
            case "node":
                tabValue = 0;
                break;
            case "scan":
                tabValue = 1;
                break;
            case "display":
                tabValue = 2;
                break;
            case "security":
                tabValue = 3;
                break;
            case "platform":
                tabValue = 4;
                break;
            default:
                log.debug("Programmer error!");
                break;
        }
        return tabValue;
    };

    handlePasswordChange = () => {
        eventEmitter.emit("handlePasswordChange");
    };

    handleBackup = () => {
        eventEmitter.emit("handleBackup");
    };

    render() {
        const {
            darkMode,
            activeTab,
            inAnimation,
            outAnimation,
            previousTab,
            masterSwitch,
            pageAnimationIn
        } = this.state;
        const {
            backgroundColor,
            textColor,
            menuActiveColor,
            toolTipColor,
            elementBaseColor
        } = uiType(darkMode);

        let platform;
        switch (os.platform()) {
            case "win32":
                platform = "Windows";
                break;
            case "linux":
                platform = "Linux";
                break;
            case "darwin":
                platform = "MacOS";
                break;
            default:
                platform = "OS";
                break;
        }

        return (
            <div>
                <Redirector />
                <div
                    className={`wholescreen ${backgroundColor} hide-scrollbar`}
                >
                    <ReactTooltip
                        effect="solid"
                        type={toolTipColor}
                        multiline
                        place="top"
                    />
                    <NavBar darkMode={darkMode} />
                    <div
                        className={`maincontent ${backgroundColor} ${pageAnimationIn} hide-scrollbar`}
                    >
                        <div className="columns">
                            <div
                                className={`column is-one-fifth ${backgroundColor}`}
                            >
                                <aside className="menu">
                                    <p className={`menu-label ${textColor}`}>
                                        Settings
                                    </p>
                                    <ul className="menu-list settings-menu">
                                        <li
                                            className={
                                                activeTab === "node"
                                                    ? `${menuActiveColor}`
                                                    : ""
                                            }
                                        >
                                            <a
                                                onClick={() =>
                                                    this.setActiveTab("node")
                                                }
                                                onKeyPress={() =>
                                                    this.setActiveTab("node")
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onMouseDown={event =>
                                                    event.preventDefault()
                                                }
                                                className={
                                                    darkMode
                                                        ? "menu-link-dark"
                                                        : ""
                                                }
                                            >
                                                <p className={textColor}>
                                                    Node
                                                </p>
                                            </a>
                                        </li>
                                        <li
                                            className={
                                                activeTab === "scan"
                                                    ? `${menuActiveColor}`
                                                    : ""
                                            }
                                        >
                                            <a
                                                onClick={() =>
                                                    this.setActiveTab("scan")
                                                }
                                                onKeyPress={() =>
                                                    this.setActiveTab("scan")
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onMouseDown={event =>
                                                    event.preventDefault()
                                                }
                                                className={
                                                    darkMode
                                                        ? "menu-link-dark"
                                                        : ""
                                                }
                                            >
                                                <p className={textColor}>
                                                    Wallet
                                                </p>
                                            </a>
                                        </li>
                                        <li
                                            className={
                                                activeTab === "display"
                                                    ? `${menuActiveColor}`
                                                    : ""
                                            }
                                        >
                                            <a
                                                onClick={() =>
                                                    this.setActiveTab("display")
                                                }
                                                onKeyPress={() =>
                                                    this.setActiveTab("display")
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onMouseDown={event =>
                                                    event.preventDefault()
                                                }
                                                className={
                                                    darkMode
                                                        ? "menu-link-dark"
                                                        : ""
                                                }
                                            >
                                                <p className={textColor}>
                                                    Display
                                                </p>
                                            </a>
                                        </li>
                                        <li
                                            className={
                                                activeTab === "security"
                                                    ? `${menuActiveColor}`
                                                    : ""
                                            }
                                        >
                                            <a
                                                onClick={() =>
                                                    this.setActiveTab(
                                                        "security"
                                                    )
                                                }
                                                onKeyPress={() =>
                                                    this.setActiveTab(
                                                        "security"
                                                    )
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onMouseDown={event =>
                                                    event.preventDefault()
                                                }
                                                className={
                                                    darkMode
                                                        ? "menu-link-dark"
                                                        : ""
                                                }
                                            >
                                                <p className={textColor}>
                                                    Security
                                                </p>
                                            </a>
                                        </li>
                                        <li
                                            className={
                                                activeTab === "platform"
                                                    ? `${menuActiveColor}`
                                                    : ""
                                            }
                                        >
                                            <a
                                                onClick={() =>
                                                    this.setActiveTab(
                                                        "platform"
                                                    )
                                                }
                                                onKeyPress={() =>
                                                    this.setActiveTab(
                                                        "platform"
                                                    )
                                                }
                                                role="button"
                                                tabIndex={0}
                                                onMouseDown={event =>
                                                    event.preventDefault()
                                                }
                                                className={
                                                    darkMode
                                                        ? "menu-link-dark"
                                                        : ""
                                                }
                                            >
                                                <p className={textColor}>
                                                    {platform} Settings
                                                </p>
                                            </a>
                                        </li>
                                    </ul>
                                </aside>
                            </div>
                            <div className="column is-one-third">
                                {activeTab === "node" && (
                                    <div className={inAnimation}>
                                        <NodeChanger darkMode={darkMode} />
                                    </div>
                                )}
                                {activeTab === "scan" && (
                                    <div className={inAnimation}>
                                        <Rescanner darkMode={darkMode} />
                                        <br />
                                        <ScanCoinbaseToggle
                                            darkMode={darkMode}
                                        />
                                        <br />
                                        <AutoOptimizationToggle
                                            darkMode={darkMode}
                                        />
                                        <br />
                                        <LogLevelSelector darkMode={darkMode} />
                                        <br />
                                        <button
                                            className={`button ${elementBaseColor}`}
                                            onClick={() => {
                                                ipcRenderer.send(
                                                    "fromFrontend",
                                                    "showDevConsole",
                                                    undefined
                                                );
                                            }}
                                        >
                                            <span className="icon is-small">
                                                <i className="fa fa-terminal" />
                                            </span>
                                            &nbsp;&nbsp; Show Console
                                        </button>
                                    </div>
                                )}

                                {activeTab === "display" && (
                                    <div className={inAnimation}>
                                        <FiatSelector darkMode={darkMode} />
                                        <br />
                                        <TimeSelector darkMode={darkMode} />
                                        <br />
                                        <DarkModeToggle darkMode={darkMode} />
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className={inAnimation}>
                                        <TimeoutSelector darkMode={darkMode} />
                                        <br />
                                        <button
                                            className="button is-warning"
                                            onClick={this.handlePasswordChange}
                                        >
                                            <span className="icon is-small">
                                                <i className="fa fa-shield-alt" />
                                            </span>
                                            &nbsp;&nbsp; Change Wallet Password
                                        </button>
                                        <br />
                                        <br />
                                        <button
                                            className="button is-danger"
                                            onClick={this.handleBackup}
                                        >
                                            <span className="icon is-small">
                                                <i className="fas fa-key" />
                                            </span>
                                            &nbsp;&nbsp; Backup Wallet Keys/Seed
                                        </button>
                                    </div>
                                )}
                                {activeTab === "platform" && (
                                    <div className={inAnimation}>
                                        <div className="button-settings-page">
                                            {os.platform() !== "darwin" && (
                                                <Fragment>
                                                    <CloseToTrayToggle
                                                        darkMode={darkMode}
                                                    />
                                                    <br />
                                                </Fragment>
                                            )}
                                            <NotificationsToggle
                                                darkMode={darkMode}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="settings-overlay">
                                    {previousTab === "node" && masterSwitch && (
                                        <div className={outAnimation}>
                                            <NodeChanger darkMode={darkMode} />
                                        </div>
                                    )}
                                    {previousTab === "scan" && masterSwitch && (
                                        <div className={outAnimation}>
                                            <Rescanner darkMode={darkMode} />
                                            <br />
                                            <ScanCoinbaseToggle
                                                darkMode={darkMode}
                                            />
                                            <br />
                                            <AutoOptimizationToggle
                                                darkMode={darkMode}
                                            />
                                        </div>
                                    )}
                                    {previousTab === "display" && masterSwitch && (
                                        <div className={outAnimation}>
                                            <FiatSelector darkMode={darkMode} />
                                            <br />
                                            <DarkModeToggle
                                                darkMode={darkMode}
                                            />
                                        </div>
                                    )}
                                    {previousTab === "security" &&
                                        masterSwitch && (
                                            <div className={outAnimation}>
                                                <TimeoutSelector
                                                    darkMode={darkMode}
                                                />
                                                <br />
                                                <button
                                                    className="button is-warning"
                                                    onClick={
                                                        this
                                                            .handlePasswordChange
                                                    }
                                                >
                                                    <span className="icon is-small">
                                                        <i className="fa fa-shield-alt" />
                                                    </span>
                                                    &nbsp;&nbsp; Change Wallet
                                                    Password
                                                </button>
                                                <br />
                                                <br />
                                                <button
                                                    className="button is-danger"
                                                    onClick={this.handleBackup}
                                                >
                                                    <span className="icon is-small">
                                                        <i className="fas fa-key" />
                                                    </span>
                                                    &nbsp;&nbsp; Backup Wallet
                                                    Keys/Seed
                                                </button>
                                            </div>
                                        )}
                                    {previousTab === "platform" &&
                                        masterSwitch && (
                                            <div className={outAnimation}>
                                                <div className="button-settings-page">
                                                    {os.platform() !==
                                                        "darwin" && (
                                                        <Fragment>
                                                            <CloseToTrayToggle
                                                                darkMode={
                                                                    darkMode
                                                                }
                                                            />
                                                            <br />
                                                        </Fragment>
                                                    )}
                                                    <br />
                                                    <NotificationsToggle
                                                        darkMode={darkMode}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <BottomBar darkMode={darkMode} />
            </div>
        );
    }
}
