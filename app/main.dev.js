// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import path from "path";
import os from "os";
import fs from "fs";
import { EventEmitter } from "events";
import {
    app,
    BrowserWindow,
    Tray,
    Menu,
    shell,
    dialog,
    ipcMain,
    nativeImage,
    systemPreferences
} from "electron";
import isDev from "electron-is-dev";
import log from "electron-log";
import contextMenu from "electron-context-menu";
import MenuBuilder from "./menu";
import iConfig from "./mainWindow/constants/config.json";
import packageInfo from "../package.json";
import MessageRelayer from "./MessageRelayer";
import Configure from "./configure";

require("electron-debug")();

// disable background throttling
app.commandLine.appendSwitch("disable-background-timer-throttling");

const homedir = os.homedir();
const directories = [
    `${homedir}/.protonwallet`,
    `${homedir}/.protonwallet/logs`
];
const [programDirectory] = directories;
const { version } = packageInfo;

const windowEvents = new EventEmitter();
export let messageRelayer = null;

let sentCloseMessage = false;

let quitTimeout = null;
let closeToTray;

let tray = null;
let trayIcon = null;

let config = null;
let frontendReady = false;
let backendReady = false;

let mainWindow = null;
let backendWindow = null;

let forceQuit = false;

if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line global-require
    const sourceMapSupport = require("source-map-support");
    sourceMapSupport.install();
}

const createDirectories = () => {
    log.debug("Checking if program directories are present...");
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            log.debug(`${dir} directories not detected, creating...`);
        }
    });
};

const readConfig = () => {
    if (fs.existsSync(`${programDirectory}/config.json`)) {
        const rawUserConfig = fs
            .readFileSync(`${programDirectory}/config.json`)
            .toString();

        // eslint-disable-next-line no-restricted-syntax

        // check if the user config is valid JSON before parsing it
        try {
            config = JSON.parse(rawUserConfig);
            config = { ...iConfig, ...config };
            fs.writeFileSync(
                `${programDirectory}/config.json`,
                JSON.stringify(config)
            );
        } catch {
            // if it isn't, set the internal config to the user config
            config = iConfig;
            fs.writeFileSync(
                `${programDirectory}/config.json`,
                JSON.stringify(config)
            );
        }
    } else {
        log.info("Creating new config.");
        config = iConfig;
        config.darkMode = systemPreferences.isDarkMode();
    }
    closeToTray = config.closeToTray;
};

const readAddressBook = () => {
    if (fs.existsSync(`${programDirectory}/addressBook.json`)) {
        const rawAddressBook = fs
            .readFileSync(`${programDirectory}/addressBook.json`)
            .toString();

        // check if the user addressBook is valid JSON before parsing it
        try {
            JSON.parse(rawAddressBook);
        } catch {
            // if it isn't, backup the invalid JSON and overwrite it with an empty addressBook
            fs.copyFileSync(
                `${programDirectory}/addressBook.json`,
                `${programDirectory}/addressBook.notvalid.json`
            );
            fs.writeFileSync(`${programDirectory}/addressBook.json`, "[]");
        }
    } else {
        fs.writeFileSync(`${programDirectory}/addressBook.json`, "[]");
    }
};

const checkSingleInstance = () => {
    const isSingleInstance = app.requestSingleInstanceLock();
    if (!isSingleInstance) {
        log.debug(
            "There's an instance of the application already locked, terminating..."
        );
        app.quit();
    }
    app.on("second-instance", () => {
        mainWindow.show();
        mainWindow.focus();
    });
};

const createContextMenu = () => {
    // create the context menu
    contextMenu({
        showInspectElement: isDev,
        showSaveImage: false,
        showCopyImage: false,
        showCopyLink: false,
        prepend: (defaultActions, params) => [
            {
                label: "Search block explorer for this hash",
                // Only show it when right-clicking a hash
                visible: params.selectionText.trim().length === 64,
                click: () => {
                    shell.openExternal(
                        `${Configure.explorerURL}/?search=${encodeURIComponent(
                            params.selectionText
                        )}`
                    );
                }
            },
            {
                label: "Cut",
                role: "cut",
                enabled: false,
                visible:
                    os.platform() !== "darwin" &&
                    params.linkURL.includes("#addressinput") &&
                    params.inputFieldType !== "plainText"
            },
            {
                label: "Copy",
                role: "copy",
                enabled: false,
                visible:
                    os.platform() !== "darwin" &&
                    params.linkURL.includes("#addressinput") &&
                    params.inputFieldType !== "plainText"
            },
            {
                label: "Paste",
                role: "paste",
                visible:
                    os.platform() !== "darwin" &&
                    params.linkURL.includes("#addressinput") &&
                    params.inputFieldType !== "plainText"
            }
        ]
    });
};

// create main window
const createMainWindow = () => {
    // await installExtensions();
    mainWindow = new BrowserWindow({
        title: `TurtleCoin Wallet v${version}`,
        useContentSize: true,
        show: false,
        width: 1250,
        height: 625,
        backgroundColor: "#121212",
        icon: nativeImage.createFromPath(
            path.join(__dirname, "images/icon.png")
        ),
        webPreferences: {
            nativeWindowOpen: true,
            nodeIntegrationInWorker: true,
            nodeIntegration: true
        }
    });
    mainWindow.loadURL(`file://${__dirname}/mainWindow/app.html`);

    if (process.platform === "darwin") {
        forceQuit = false;
        app.on("before-quit", function() {
            forceQuit = true;
        });
        mainWindow.on("close", function(event) {
            if (!forceQuit) {
                event.preventDefault();
                mainWindow?.hide();
            }
        });
    } else {
        mainWindow.on("close", function(event) {
            if (closeToTray) {
                event.preventDefault();
                mainWindow?.hide();
            } else {
              if (!sentCloseMessage) {
                messageRelayer.sendToBackend("stopRequest");
                quitTimeout = setTimeout(app.exit, 1000 * 10);
              }
            }
        });
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.webContents.on("did-finish-load", () => {
        console.log("Main window finished loading.")
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        mainWindow.show();

        frontendReady = true;
        if (frontendReady && backendReady) {
            windowEvents.emit("bothWindowsReady");
        }
    });
};

const createBackWindow = () => {
    backendWindow = new BrowserWindow({
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    backendWindow.loadURL(`file://${__dirname}/backendWindow/app.html`);
    backendWindow.webContents.on("did-finish-load", () => {
        if (!backendWindow) {
            throw new Error('"backendWindow" is not defined');
        }
        backendReady = true;
        if (frontendReady && backendReady) {
            windowEvents.emit("bothWindowsReady");
        }
    });
};

const createMenu = () => {
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
};

const createTray = () => {
    // no tray icon for mac
    if (os.platform() !== "darwin") {
        // set tray icon first
        if (os.platform() !== "win32") {
            trayIcon = path.join(
                __dirname,
                "./mainWindow/images/icon_color_64x64.png"
            );
        } else {
            console.log("attempting to set tray icon to " + path.join(__dirname, "./mainWindow/images/icon.ico"))
            trayIcon = path.join(__dirname, "./mainWindow/images/icon.ico");
        }
        tray = new Tray(trayIcon);


        // then set the context menu
        tray.setContextMenu(
            Menu.buildFromTemplate([
                {
                    label: "Show App",
                    click() {
                        if (mainWindow) {
                            mainWindow.show();
                            mainWindow.focus();
                        }
                    }
                },
                {
                    label: "Quit",
                    click() {
                      if (!sentCloseMessage) {
                        messageRelayer.sendToBackend("stopRequest");
                        forceQuit = true;
                        quitTimeout = setTimeout(app.exit, 1000 * 10);
                      }
                    }
                }
            ])
        );

        // set events
        tray.on("click", () => showMainWindow());
    }
};

const showMainWindow = () => {
    if (mainWindow) {
        mainWindow.show();
    }
};

const setCloseToTray = (state: boolean) => {
    closeToTray = state;
};

// event function listeners
const setEventListeners = () => {
    // catch uncaught exceptions
    process.on("uncaughtException", event => {
        console.log(event);
        // catch uncaught exceptions in the main process
        dialog.showErrorBox(
            "Uncaught Error",
            "An unexpected error has occurred. Please report this error, and what you were doing to cause it."
        );
        process.exit(1);
    });

    windowEvents.on("bothWindowsReady", () => {
        console.log("Both windows are ready.");
        messageRelayer = new MessageRelayer(mainWindow, backendWindow);
        log.info(config);
        messageRelayer.sendToBackend("config", config);
        messageRelayer.sendToFrontend("config", {
            config,
            configPath: directories[0]
        });
    });

    ipcMain.on("resizeWindow", (event: any, dimensions: any) => {
        const { width, height } = dimensions;
        mainWindow.setSize(width, height);
    });

    ipcMain.on("windowResized", async () => {
        console.log("window resized");
        const [width, height] = mainWindow.getSize();

        mainWindow.send("newWindowSize", { width, height });
    });

    ipcMain.on("closeToTrayToggle", (event: any, state: boolean) => {
        setCloseToTray(state);
    });

    ipcMain.on("backendStopped", () => {
        clearTimeout(quitTimeout);
        app.exit();
    });

    ipcMain.on("frontReady", () => {
        mainWindow.show();
        mainWindow.focus();
    });
};

/* SETUP LOGIC STARTS HERE */

checkSingleInstance();
createDirectories();
readConfig();
readAddressBook();
setEventListeners();

app.on("window-all-closed", () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
    if (process.platform === "darwin") {
        mainWindow?.show();
    }
});
app.on("ready", () => {
    createContextMenu();
    createTray();
    createMainWindow();
    createBackWindow();
    createMenu();
});
