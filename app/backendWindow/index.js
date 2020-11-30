// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from "fs";
import { ipcRenderer, IpcRendererEvent, clipboard, remote } from "electron";
import isDev from "electron-is-dev";
import log from "electron-log";
import Backend from "./Backend";

let backend = null;

ipcRenderer.on("fromMain", (event: IpcRendererEvent, message: any) => {
    parseMessage(message);
});

ipcRenderer.on("fromFrontend", (event: IpcRendererEvent, message: any) => {
    parseMessage(message);
});

async function parseMessage(message: any) {
    const { messageType, data } = message;
    switch (messageType) {
        case "handleLedger":
            await backend.importFromLedger();
            break;
        case "config":
            if (data.walletFile !== "") {
                backend = new Backend(data);
            }
            break;
        case "showDevConsole":
            if (isDev) {
                remote.getCurrentWebContents().toggleDevTools();
            } else {
                remote.getCurrentWebContents().openDevTools({ mode: "detach" });
            }
            break;
        case "stopRequest":
            if (backend) {
                await backend.stop(true);
            } else {
                ipcRenderer.send("backendStopped");
            }
            break;
        case "transactionSearchQuery":
            backend.transactionSearch(data);
            break;
        case "notificationsRequest":
            backend.setNotifications(data);
            break;
        case "logLevelRequest":
            backend.setLogLevel(data);
            break;
        case "scanCoinbaseRequest":
            backend.setScanCoinbaseTransactions(data);
            break;
        case "AutoOptimizationRequest":
            backend.setenableAutoOptimization(data);
            break;
        case "rescanRequest":
            backend.rescanWallet(data);
            break;
        case "changeNode":
            backend.changeNode(data);
            break;
        case "backupToFile":
            const key_file = await backend.getSecret();
            fs.writeFile(data, key_file, error => {
                if (error) {
                    throw error;
                }
            });
            break;
        case "backupToClipboard":
            const keys = await backend.getSecret();
            clipboard.writeText(keys);
            break;
        case "exportToCSV":
            backend.exportToCSV(data);
            break;
        case "saveWallet":
            backend.saveWallet(data);
            break;
        case "saveWalletAs":
            backend.saveWallet(data.notify, data.savePath);
            break;
        case "openNewWallet":
            if (backend) {
                backend.stop(false);
                backend = null;
            }
            break;
        case "walletPassword":
            backend.startWallet(data);
            break;
        case "verifyWalletPassword":
            backend.verifyPassword(data);
            break;
        case "changePasswordRequest":
            backend.changePassword(data);
            break;
        case "transactionRequest":
            // data is the amount of transactions to get
            backend.getTransactions(data);
            break;
        case "prepareTransactionRequest":
            backend.prepareTransaction(data);
            break;
        case "sendTransactionRequest":
            backend.sendTransaction(data);
            break;
        default:
            log.info(`UNSUPPORTED: ${message}`);
            break;
    }
}
