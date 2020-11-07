// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import path from 'path';
import React, { Fragment } from 'react';
import LocalizedStrings from 'react-localization';
import ErrorBoundary from 'react-error-boundary';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { ipcRenderer, remote, webFrame } from 'electron';
import EventEmitter from 'events';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import WalletSession from './wallet/session';
import iConfig from './constants/config.json';
import AutoUpdater from './wallet/autoUpdater';
import LoginCounter from './wallet/loginCounter';
import { uiType } from './utils/utils';
import ProtonConfig from './wallet/protonConfig';
import Configure from "../Configure";

export function savedInInstallDir(response: string) {
  const programDirectory = path.resolve(remote.app.getAppPath(), '../../');
  const saveDirectory = path.resolve(response, '../');

  log.info(programDirectory, saveDirectory);

  const relative = path.relative(programDirectory, saveDirectory);
  return (
    (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) ||
    programDirectory === saveDirectory
  );
}

const homedir = os.homedir();

export const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

export const il8n = new LocalizedStrings({
  // eslint-disable-next-line global-require
  en: require('./il8n/en.json'),
  // eslint-disable-next-line global-require
  fr: require('./il8n/fr.json')
});

export let config = iConfig;
export let configManager = null;

export const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(6);

export const updater = new AutoUpdater();
updater.getLatestVersion();

export let loginCounter = new LoginCounter();

remote.app.setAppUserModelId('wallet.proton.extra');

log.debug(`TurtleCoin wallet started...`);

if (
  localStorage.getItem('windowWidth') &&
  localStorage.getItem('windowHeight')
) {
  ipcRenderer.send('resizeWindow', {
    width: Number(localStorage.getItem('windowWidth')),
    height: Number(localStorage.getItem('windowHeight'))
  });
}

if (localStorage.getItem('zoomFactor') === null) {
  localStorage.setItem('zoomFactor', 1);
}

webFrame.setZoomFactor(Number(localStorage.getItem('zoomFactor')));

window.onresize = () => {
  ipcRenderer.send('windowResized');
};

ipcRenderer.on('newWindowSize', (event, dimensions) => {
  console.log('reached');
  const { width, height } = dimensions;
  localStorage.setItem('windowWidth', width);
  localStorage.setItem('windowHeight', height);
});

const [programDirectory] = directories;

export const addressList = JSON.parse(
  fs.readFileSync(`${programDirectory}/addressBook.json`).toString()
);

let { darkMode } = config;
let { textColor } = uiType(darkMode);

eventEmitter.on('darkmodeon', () => {
  textColor = 'has-text-white';
});
eventEmitter.on('darkmodeoff', () => {
  textColor = 'has-text-dark';
});

export let session = new WalletSession();

ipcRenderer.on('handleDonate', handleDonate);
eventEmitter.on('handleDonate', handleDonate);

let latestUpdate = '';

eventEmitter.on('sendTransaction', handleSendTransaction);

eventEmitter.on('updateRequired', updateFile => {
  latestUpdate = updateFile;
  const message = (
    <div>
      <center>
        <p className={`subtitle ${textColor}`}>New Version Available!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        There&apos;s a new version of TurtleCoin Wallet available. Would you
        like to download it?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Download',
    `Not Right Now`,
    'getUpdate'
  );
});

ipcRenderer.on('fromMain', (event: Electron.IpcRendererEvent, message: any) => {
  const { data, messageType } = message;
  switch (messageType) {
    case 'config':
      const config = data.config;

      const configPath = data.configPath;
      // eslint-disable-next-line prefer-destructuring
      darkMode = config.darkMode;
      // eslint-disable-next-line prefer-destructuring
      textColor = uiType(darkMode).textColor;
      configManager = new ProtonConfig(config, configPath);
      reInitWallet(config.walletFile);
      ipcRenderer.send('frontReady');
      break;
    default:
      log.info(data);
      break;
  }
});

ipcRenderer.on(
  'fromBackend',
  (event: Electron.IpcRendererEvent, message: any) => {
    const { data, messageType } = message;

    switch (messageType) {
      case 'authenticationError':
        handleAuthenticationError(data);
        break;
      case 'prepareTransactionResponse':
        handlePrepareTransactionResponse(data);
        break;
      case 'transactionCount':
        session.setTransactionCount(data);
        break;
      case 'rescanResponse':
        handleRescanResponse(data);
        break;
      case 'daemonConnectionInfo':
        session.setDaemonConnectionInfo(data);
        break;
      case 'passwordChangeResponse':
        handlePasswordChangeResponse(data);
        break;
      case 'saveWalletResponse':
        handleSaveWalletResponse(data);
        break;
      case 'walletActiveStatus':
        loginCounter.setWalletActive(data);
        break;
      case 'primaryAddress':
        session.setPrimaryAddress(data);
        break;
      case 'transactionList':
        session.setTransactions(data);
        break;
      case 'syncStatus':
        session.setSyncStatus(data);
        break;
      case 'balance':
        session.setBalance(data);
        break;
      case 'nodeFee':
        session.setNodeFee(data);
        break;
      case 'sendTransactionResponse':
        handleSendTransactionResponse(data);
        break;
      case 'backendLogLine':
        session.addBackendLogLine(data);
        break;
      default:
        break;
    }
  }
);

function handleRescanResponse(height: string) {
  const modalMessage = (
    <div>
      <center>
        <p className={`title ${textColor}`}>Success!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        Your wallet is now rescanning from block {height}. Patience is a virtue!
      </p>
    </div>
  );
  eventEmitter.emit('openModal', modalMessage, 'OK', null, 'transactionCancel');
}

function handlePrepareTransactionResponse(response: any) {
  if (response.status === 'FAILURE') {
    const modalMessage = (
      <div>
        <center>
          <p className="title has-text-danger">Error!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The transaction was not successful.
        </p>
        <p className={`subtitle ${textColor}`}>{response.error.errorString}</p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      modalMessage,
      'OK',
      null,
      'transactionCancel'
    );
  }
}

function handleSendTransactionResponse(response: any) {
  if (response.status === 'SUCCESS') {
    const modalMessage = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Success!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          Transaction succeeded! Transaction hash:
        </p>
        <p className={`subtitle ${textColor}`}>{response.hash}</p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      modalMessage,
      'OK',
      null,
      'transactionCancel'
    );
  } else {
    const modalMessage = (
      <div>
        <center>
          <p className="title has-text-danger">Error!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The transaction was not successful.
        </p>
        <p className={`subtitle ${textColor}`}>{response.error.errorString}</p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      modalMessage,
      'OK',
      null,
      'transactionCancel'
    );
  }
}

function handleSaveWalletResponse(response: any) {
  // response is a boolean indicating
  // if save was successful
  if (response) {
    const modalMessage = (
      <div>
        <center>
          <p className={`subtitle ${textColor}`}>Wallet Saved!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The wallet was saved successfully.
        </p>
      </div>
    );
    eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
  } else {
    const modalMessage = (
      <div>
        <center>
          <p className="subtitle has-text-danger">Save Error!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The wallet did not save successfully. Check your directory permissions
          and try again.
        </p>
      </div>
    );
    eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
  }
}

function handleAuthenticationError(error: any) {
  const message = (
    <div>
      <center>
        <p className="title has-text-danger">Wallet Open Error!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>{error.errorString}</p>
    </div>
  );
  eventEmitter.emit('openModal', message, 'OK', null, null);
}

function handlePasswordChangeResponse(response: any) {
  const { status, error } = response;
  if (status === 'SUCCESS') {
    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Success!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The password was changed successfully. Take care not to forget it.
        </p>
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', null, 'openNewWallet');
  } else {
    if (error === 'AUTHERROR') {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Incorrect Password!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            You did not enter your current password correctly. Please try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    }
    if (error === 'SAVEERROR') {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The password was not changed sucessfully because the wallet could
            not be saved to disk. Check that you have write permissions to the
            file and try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    }
  }
}

eventEmitter.on('getUpdate', () => {
  remote.shell.openExternal(latestUpdate);
  remote.app.exit();
});

ipcRenderer.on('handleLedger', () => {
  const message = (
    <p className={`subtitle ${textColor}`}>
      Please check your Ledger and enter the PIN when prompted.
    </p>
  );

  eventEmitter.emit('openModal', message, 'OK', null, null);
});

ipcRenderer.on('handleLock', () => {
  if (session && loginCounter.isLoggedIn && session.walletPassword !== '') {
    eventEmitter.emit('logOut');
  }
});

ipcRenderer.on('handleSaveAs', async () => {
  if (!loginCounter.isLoggedIn || !loginCounter.walletActive) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const response = await remote.dialog.showSaveDialog(null, options);
  if (response.canceled) {
    return;
  }

  log.info(response);

  const request = { notify: true, savePath: `${response.filePath}` };
  ipcRenderer.send('fromFrontend', 'saveWalletAs', request);
});

ipcRenderer.on('exportToCSV', async () => {
  if (!loginCounter.isLoggedIn || !loginCounter.walletActive) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'CSV Text File',
        extensions: ['csv']
      }
    ]
  };
  const response = await remote.dialog.showSaveDialog(null, options);
  if (response.canceled) {
    return;
  }
  ipcRenderer.send('fromFrontend', 'exportToCSV', response.filePath);
});

ipcRenderer.on('zoomDefault', () => {
  webFrame.setZoomFactor(1);
  localStorage.setItem('zoomFactor', webFrame.getZoomFactor());
});

ipcRenderer.on('zoomIn', () => {
  webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
  localStorage.setItem('zoomFactor', webFrame.getZoomFactor());
});

ipcRenderer.on('zoomOut', () => {
  webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
  localStorage.setItem('zoomFactor', webFrame.getZoomFactor());
});

ipcRenderer.on('handleOpen', handleOpen);
eventEmitter.on('handleOpen', handleOpen);

function handleAbout() {
  remote.shell.openExternal(`${Configure.GitHubRepo}/issues#readme`);
}

function handleHelp() {
  remote.shell.openExternal(`${Configure.DiscordURL}`);
}

function handleIssues() {
  remote.shell.openExternal(`${Configure.GitHubRepo}/issues`);
}

eventEmitter.on('handleHelp', handleHelp);
eventEmitter.on('handleAbout', handleAbout);
eventEmitter.on('handleIssues', handleIssues);

ipcRenderer.on('handleNew', handleNew);
eventEmitter.on('handleNew', handleNew);

eventEmitter.on('backupToFile', backupToFile);
eventEmitter.on('backupToClipboard', backupToClipboard);

ipcRenderer.on('handleBackup', handleBackup);
eventEmitter.on('handleBackup', handleBackup);

eventEmitter.on('handleImport', handleImport);
ipcRenderer.on('handleImport', handleImport);

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

// eslint-disable-next-line no-unused-vars
const uncaughtErrorHandler = (error: Error, componentStack: string) => {
  log.debug(error);
};

// eslint-disable-next-line react/prop-types
const uncaughtErrorComponent = ({ componentStack, error }) => (
  <div className="wholescreen has-background-black">
    <div className="elem-to-center box has-background-dark">
      <h1 className="title has-text-white has-text-centered">
        <i className="fas fa-skull" />
        &nbsp;&nbsp;Uh oh, this isn&apos;t good.
      </h1>
      <p className="has-text-white">
        Something bad happened and we couldn&apos;t open your wallet. This is
        probably a programmer error. Error details are below.
      </p>
      <br />
      <p className="has-text-white">{error.toString()}</p>
      <p className="has-text-white">{componentStack}</p>
    </div>
  </div>
);

render(
  <AppContainer>
    <ErrorBoundary
      onError={uncaughtErrorHandler}
      FallbackComponent={uncaughtErrorComponent}
    >
      <div
        onClick={activityDetected}
        onKeyPress={activityDetected}
        role="button"
        tabIndex={0}
      >
        <Root store={store} history={history} />
      </div>
    </ErrorBoundary>
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <div
          onClick={activityDetected}
          onKeyPress={activityDetected}
          role="button"
          tabIndex={0}
        >
          <NextRoot store={store} history={history} />{' '}
        </div>
      </AppContainer>,
      document.getElementById('root')
    );
  });
}

function handleSendTransaction() {
  ipcRenderer.send(
    'fromFrontend',
    'sendTransactionRequest',
    session.getPreparedTransactionHash()
  );
}

function handleDonate() {
  eventEmitter.emit('goToDonate');
}

function activityDetected() {
  eventEmitter.emit('activityDetected');
}

function handleImport() {
  log.debug('User selected to import wallet.');
  const message = (
    <div>
      <center>
        <p className={`title ${textColor}`}>Select Import Type</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        Would you like to import from seed or keys?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Seed',
    null,
    'importSeed',
    'Keys',
    'importKey'
  );
}

function backupToClipboard() {
  if (!loginCounter.isLoggedIn || !loginCounter.walletActive) {
    return;
  }

  ipcRenderer.send('fromFrontend', 'backupToClipboard', undefined);
}

export async function backupToFile() {
  if (!loginCounter.isLoggedIn || !loginCounter.walletActive) {
    return;
  }

  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'Text File',
        extensions: ['txt']
      }
    ]
  };

  const response = await remote.dialog.showSaveDialog(null, options);
  if (response.canceled) {
    return;
  }

  ipcRenderer.send('fromFrontend', 'backupToFile', response.filePath);
}

function handleBackup() {
  if (!loginCounter.isLoggedIn) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const message = (
    <div>
      <center>
        <p className={`subtitle ${textColor}`}>Backup</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        How would you like to back up your keys?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Copy to Clipboard',
    null,
    'backupToClipboard',
    'Save to File',
    'backupToFile'
  );
}

function handleNew() {
  eventEmitter.emit('goToNewWallet');
}

// TODO: verify that it's a wallet file before opening
async function handleOpen() {
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const response = await remote.dialog.showOpenDialog(null, options);

  if (response.canceled) {
    return;
  }

  reInitWallet(response.filePaths[0]);
}

export function reInitWallet(walletPath: string) {
  log.info('reInitWallet() called');
  log.info('parameter:');
  log.info(walletPath);

  ipcRenderer.send('fromFrontend', 'openNewWallet', undefined);
  configManager.modifyConfig('walletFile', walletPath);
  ipcRenderer.send('fromFrontend', 'config', config);
  session = new WalletSession();
  loginCounter = new LoginCounter();
  eventEmitter.emit('goToLogin');
  eventEmitter.emit('refreshLogin');
}
