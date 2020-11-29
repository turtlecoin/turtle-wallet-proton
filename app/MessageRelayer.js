// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { ipcMain, IpcMainEvent } from "electron";
import log from "electron-log";

export default class MessageRelayer {
    mainWindow: BrowserWindow;

    backendWindow: BrowserWindow;

    constructor(mainWindow, backendWindow) {
        this.mainWindow = mainWindow;
        this.backendWindow = backendWindow;

        ipcMain.on(
            "fromBackend",
            (event: IpcMainEvent, messageType: string, data: any) => {
                const message = { messageType, data };
                this.mainWindow.send("fromBackend", message);
            }
        );

        ipcMain.on(
            "fromFrontend",
            (event: IpcMainEvent, messageType: string, data: any) => {
                const message = { messageType, data };
                this.backendWindow.send("fromFrontend", message);
            }
        );
    }

    sendToBackend(messageType: string, data: any) {
        const message = { messageType, data };
        this.backendWindow.send("fromMain", message);
    }

    sendToFrontend(messageType: string, data: any) {
        const message = { messageType, data };
        this.mainWindow.send("fromMain", message);
    }
}
