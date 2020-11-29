// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { config } from "../index";

export default class LoginCounter {
    userLoginAttempted: boolean;

    isLoggedIn: boolean;

    lastLoginAttemptFailed: boolean;

    freshRestore: boolean;

    loginsAttempted: number;

    navBarCount: number;

    daemonLog: string[];

    loopTest: boolean;

    looping: boolean;

    lastSettingsTab: string;

    pageFocusStack: string[];

    pageAnimationIn: string;

    selectedLog: string;

    daemonFailedInit: boolean;

    walletActive: boolean;

    constructor() {
        this.userLoginAttempted = false;
        this.isLoggedIn = false;
        this.lastLoginAttemptFailed = false;
        this.freshRestore = false;
        this.loginsAttempted = 0;
        this.navBarCount = 0;
        this.loopTest = false;
        this.looping = false;
        this.lastSettingsTab = "node";
        this.pageFocusStack = [];
        this.selectedLog = config.useLocalDaemon ? "daemon" : "wallet-backend";
        this.daemonFailedInit = false;
        this.walletActive = false;
    }

    setWalletActive(status: boolean) {
        this.walletActive = status;
    }

    getAnimation(currentPage: string) {
        const currentPageValue: number = this.evaluatePageValue(currentPage);
        const previousPageValue: number = this.evaluatePageValue(
            this.pageFocusStack[0]
        );

        if (previousPageValue === -2) {
            return "fadein";
        }

        if (previousPageValue === -1 && currentPageValue !== -1) {
            return "";
        }
        if (previousPageValue !== -1 && currentPageValue === -1) {
            return "";
        }
        if (currentPageValue > previousPageValue) {
            return "slide-in-right";
        }
        if (currentPageValue < previousPageValue) {
            return "slide-in-left";
        }
        return "";
    }

    evaluatePageValue(location: string) {
        let pageValue: number;
        switch (location) {
            case "/login":
                pageValue = -2;
                break;
            case "/":
                pageValue = 0;
                break;
            case "/send":
                pageValue = 1;
                break;
            case "/receive":
                pageValue = 2;
                break;
            case "/addressbook":
                pageValue = 3;
                break;
            case "/terminal":
                pageValue = 4;
                break;
            case "/settings":
                pageValue = 5;
                break;
            default:
                pageValue = -1;
                break;
        }
        return pageValue;
    }
}
