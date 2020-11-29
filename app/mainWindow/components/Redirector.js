// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import log from "electron-log";
import { ipcRenderer } from "electron";
import { Redirect, withRouter } from "react-router-dom";
import { session, eventEmitter, loginCounter, config } from "../index";
import donateInfo from "../constants/donateInfo.json";

type State = {
    home: boolean,
    importKey: boolean,
    importSeed: boolean,
    changePassword: boolean,
    firstStartup: boolean,
    loginFailed: boolean,
    login: boolean,
    isLoggedIn: boolean,
    freshRestore: boolean,
    autoLockInterval: number,
    autoLockEnabled: boolean,
    settings: boolean,
    newWallet: boolean,
    donate: boolean,
    ledgerImport: boolean
};

type Location = {
    hash: string,
    pathname: string,
    search: string
};

type Props = {
    location: Location
};

class Redirector extends Component<Props, State> {
    props: Props;

    state: State;

    activityTimer: TimeoutID;

    refreshPrice: IntervalID;

    constructor(props?: Props) {
        super(props);
        this.state = {
            home: false,
            importKey: false,
            importSeed: false,
            changePassword: false,
            firstStartup: session.firstStartup,
            loginFailed: session.loginFailed,
            login: false,
            isLoggedIn: loginCounter.isLoggedIn,
            freshRestore: loginCounter.freshRestore,
            autoLockInterval: config.autoLockInterval,
            autoLockEnabled: config.autoLockEnabled,
            settings: false,
            newWallet: false,
            donate: false,
            ledgerImport: false
        };
        const { autoLockInterval, autoLockEnabled } = this.state;
        this.goToImportFromSeed = this.goToImportFromSeed.bind(this);
        this.goToImportFromKey = this.goToImportFromKey.bind(this);
        this.goToPasswordChange = this.goToPasswordChange.bind(this);
        this.goToSettings = this.goToSettings.bind(this);
        this.goToHome = this.goToHome.bind(this);
        this.goToLogin = this.goToLogin.bind(this);
        this.logOut = this.logOut.bind(this);
        this.setAutoLock = this.setAutoLock.bind(this);
        this.goToNewWallet = this.goToNewWallet.bind(this);
        this.goToDonate = this.goToDonate.bind(this);

        if (
            session.walletPassword !== "" &&
            loginCounter.isLoggedIn &&
            autoLockEnabled
        ) {
            this.activityTimer = setTimeout(
                () => this.logOut(),
                1000 * 60 * autoLockInterval
            );
        }
        if (config.displayCurrency === "fiat") {
            this.refreshPrice = setInterval(this.getPrice, 1000 * 30);
        }
    }

    componentDidMount() {
        ipcRenderer.on("importSeed", this.goToImportFromSeed);
        ipcRenderer.on("importKey", this.goToImportFromKey);
        ipcRenderer.on("handlePasswordChange", this.goToPasswordChange);
        eventEmitter.on("importLedger", this.goToLedgerImport);
        eventEmitter.on("importSeed", this.goToImportFromSeed);
        eventEmitter.on("importKey", this.goToImportFromKey);
        eventEmitter.on("handlePasswordChange", this.goToPasswordChange);
        eventEmitter.on("openNewWallet", this.goToHome);
        eventEmitter.on("initializeNewSession", this.goToHome);
        eventEmitter.on("refreshLogin", this.goToHome);
        eventEmitter.on("loginFailed", this.goToLogin);
        eventEmitter.on("goHome", this.goToHome);
        eventEmitter.on("goToLogin", this.goToLogin);
        eventEmitter.on("logOut", this.logOut);
        eventEmitter.on("activityDetected", this.resetTimeout);
        eventEmitter.on("newLockInterval", this.resetTimeout);
        eventEmitter.on("setAutoLock", this.setAutoLock);
        eventEmitter.on("goToSettings", this.goToSettings);
        eventEmitter.on("goToNewWallet", this.goToNewWallet);
        eventEmitter.on("goToDonate", this.goToDonate);

        // prettier-ignore
        const { location: { pathname } } = this.props;
        const splitPath = pathname.split("/");
        const cleanPath = `/${splitPath[1]}`;

        loginCounter.pageFocusStack.unshift(cleanPath);
        if (loginCounter.pageFocusStack.length > 1) {
            loginCounter.pageFocusStack.pop();
        }
    }

    componentWillUnmount() {
        ipcRenderer.off("importSeed", this.goToImportFromSeed);
        ipcRenderer.off("importKey", this.goToImportFromKey);
        ipcRenderer.off("handlePasswordChange", this.goToPasswordChange);
        eventEmitter.off("importLedger", this.goToLedgerImport);
        eventEmitter.off("importSeed", this.goToImportFromSeed);
        eventEmitter.off("importKey", this.goToImportFromKey);
        eventEmitter.off("handlePasswordChange", this.goToPasswordChange);
        eventEmitter.off("openNewWallet", this.goToHome);
        eventEmitter.off("initializeNewSession", this.goToHome);
        eventEmitter.off("refreshLogin", this.goToHome);
        eventEmitter.off("loginFailed", this.goToLogin);
        eventEmitter.off("goHome", this.goToHome);
        eventEmitter.off("goToLogin", this.goToLogin);
        eventEmitter.off("logOut", this.logOut);
        eventEmitter.off("activityDetected", this.resetTimeout);
        eventEmitter.off("newLockInterval", this.resetTimeout);
        eventEmitter.off("setAutoLock", this.setAutoLock);
        eventEmitter.off("goToSettings", this.goToSettings);
        eventEmitter.off("goToNewWallet", this.goToNewWallet);
        eventEmitter.off("goToDonate", this.goToDonate);
        clearTimeout(this.activityTimer);
        clearInterval(this.refreshPrice);
    }

    goToLedgerImport = () => {
        this.setState({
            ledgerImport: true
        });
    };

    goToDonate = () => {
        this.setState({
            donate: true
        });
    };

    goToNewWallet = () => {
        this.setState({
            newWallet: true
        });
    };

    getPrice = () => {
        session.getFiatPrice(config.selectedFiat);
    };

    setAutoLock = async (enable: boolean) => {
        if (enable) {
            await this.setState({
                autoLockEnabled: true
            });
            this.resetTimeout();
        } else {
            await this.setState({
                autoLockEnabled: false
            });
            clearTimeout(this.activityTimer);
        }
    };

    logOut = () => {
        loginCounter.isLoggedIn = false;
        loginCounter.userLoginAttempted = false;
        loginCounter.loginsAttempted = 0;
        session.loginFailed = false;
        this.goToLogin();
        log.debug("Wallet was locked.");
    };

    resetTimeout = async (timeout?: number) => {
        const { autoLockEnabled } = this.state;
        if (!autoLockEnabled) {
            return;
        }
        if (timeout) {
            await this.setState({
                autoLockInterval: timeout
            });
        }
        const { autoLockInterval } = this.state;
        if (session.walletPassword !== "" && loginCounter.isLoggedIn) {
            clearTimeout(this.activityTimer);
            this.activityTimer = setTimeout(
                () => this.logOut(),
                1000 * 60 * autoLockInterval
            );
        }
    };

    goToSettings = () => {
        this.setState({
            settings: true
        });
    };

    goToLogin = () => {
        this.setState({
            login: true
        });
    };

    goToHome = () => {
        this.setState({
            home: true
        });
    };

    goToImportFromSeed = () => {
        this.setState({
            importSeed: true
        });
    };

    goToImportFromKey = () => {
        this.setState({
            importKey: true
        });
    };

    goToPasswordChange = () => {
        this.setState({
            changePassword: true
        });
    };

    goToFirstStartup = () => {
        this.setState({
            firstStartup: true
        });
    };

    render() {
        // prettier-ignore
        const { location: { pathname } } = this.props;
        const {
            changePassword,
            importKey,
            importSeed,
            loginFailed,
            firstStartup,
            home,
            login,
            isLoggedIn,
            freshRestore,
            settings,
            newWallet,
            donate,
            ledgerImport
        } = this.state;

        if (ledgerImport === true && pathname != "/importledger") {
            return <Redirect to="/importledger" />;
        }

        if (freshRestore === true && pathname !== "/changepassword") {
            loginCounter.freshRestore = false;
            return <Redirect to="/changepassword" />;
        }
        if (home === true && pathname !== "/") {
            return <Redirect to="/" />;
        }
        if (changePassword === true && pathname !== "/changepassword") {
            return <Redirect to="/changepassword" />;
        }

        if (settings === true && pathname !== "/settings") {
            return <Redirect to="/settings" />;
        }

        if (importKey === true && pathname !== "/importkey") {
            return <Redirect to="/importkey" />;
        }

        if (importSeed === true && pathname !== "/import") {
            return <Redirect to="/import" />;
        }

        if (newWallet === true && pathname !== "/newwallet") {
            return <Redirect to="/newwallet" />;
        }

        if (donate === true && !pathname.includes("/send")) {
            return (
                <Redirect
                    to={`/send/${donateInfo.address}/${donateInfo.paymentID}`}
                />
            );
        }

        if (
            loginFailed === true &&
            pathname !== "/login" &&
            pathname !== "/import" &&
            pathname !== "/importkey" &&
            pathname !== "/importledger" &&
            pathname !== "/firststartup" &&
            pathname !== "/newwallet"
        ) {
            return <Redirect to="/login" />;
        }

        if (login === true && pathname !== "/login") {
            return <Redirect to="/login" />;
        }

        if (
            isLoggedIn === false &&
            pathname !== "/login" &&
            pathname !== "/import" &&
            pathname !== "/importkey" &&
            pathname !== "/importledger" &&
            pathname !== "/firststartup" &&
            pathname !== "/newwallet"
        ) {
            return <Redirect to="/login" />;
        }

        if (
            firstStartup === true &&
            pathname !== "/firststartup" &&
            pathname !== "/import" &&
            pathname !== "/importkey" &&
            pathname !== "/importledger" &&
            pathname !== "/newwallet"
        ) {
            return <Redirect to="/firststartup" />;
        }

        return null;
    }
}

export default withRouter(Redirector);
