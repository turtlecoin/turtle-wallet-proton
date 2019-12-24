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
import { ipcRenderer, remote, clipboard } from 'electron';
import EventEmitter from 'events';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import WalletSession from './wallet/session';
import iConfig from './constants/config';
import AutoUpdater from './wallet/autoUpdater';
import LoginCounter from './wallet/loginCounter';
import uiType from './utils/uitype';
import DaemonLogger from './wallet/DaemonLogger';

export function savedInInstallDir(savePath: string) {
  const programDirectory = path.resolve(remote.app.getAppPath(), '../../');
  const saveDirectory = path.resolve(savePath, '../');

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

export const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(6);

export const updater = new AutoUpdater();
updater.getLatestVersion();

export let loginCounter = new LoginCounter();

remote.app.setAppUserModelId('wallet.proton.extra');

log.debug(`Proton wallet started...`);

const [programDirectory] = directories;

if (!fs.existsSync(`${programDirectory}/config.json`)) {
  log.debug('Config not detected, writing internal config to disk...');
} else {
  log.debug("Config file found in user's home directory, using it...");
  const rawUserConfig = fs
    .readFileSync(`${programDirectory}/config.json`)
    .toString();

  // add possible missing fields using internal config values
  try {
    config = Object.assign(config, JSON.parse(rawUserConfig));
  } catch {
    log.debug('User config is not valid JSON!');
  }
}

export const addressList = JSON.parse(
  fs.readFileSync(`${programDirectory}/addressBook.json`).toString()
);

fs.writeFile(
  `${programDirectory}/config.json`,
  JSON.stringify(config, null, 4),
  err => {
    if (err) throw err;
  }
);

const { darkMode, daemonLogPath, useLocalDaemon } = config;

export let daemonLogger = null;

if (useLocalDaemon && daemonLogPath) {
  try {
    daemonLogger = new DaemonLogger(daemonLogPath);
  } catch (error) {
    log.error('Tail initialization failed.');
    log.error(error);
  }
}

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

ipcRenderer.on('handleClose', () => {
  remote.app.exit();
});

let latestUpdate = '';

eventEmitter.on('updateRequired', updateFile => {
  latestUpdate = updateFile;
  const message = (
    <div>
      <center>
        <p className={`subtitle ${textColor}`}>New Version Available!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        There&apos;s a new version of Proton Wallet available. Would you like to
        download it?
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

ipcRenderer.on(
  'fromBackend',
  (event: Electron.IpcRendererEvent, message: any) => {
    const { data, messageType } = message;

    switch (messageType) {
      case 'saveWalletResponse':
        // data is a boolean indicating
        // if save was successful
        if (data) {
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
                The wallet did not save successfully. Check your directory
                permissions and try again.
              </p>
            </div>
          );
          eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
        }
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
        if (data.status === 'SUCCESS') {
          const modalMessage = (
            <div>
              <center>
                <p className={`title ${textColor}`}>Success!</p>
              </center>
              <br />
              <p className={`subtitle ${textColor}`}>
                Transaction succeeded! Transaction hash:
              </p>
              <p className={`subtitle ${textColor}`}>{data.hash}</p>
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
          log.info(data);
          const modalMessage = (
            <div>
              <center>
                <p className="title has-text-danger">Error!</p>
              </center>
              <br />
              <p className={`subtitle ${textColor}`}>
                The transaction was not successful.
              </p>
              <p className={`subtitle ${textColor}`}>
                {data.error.customMessage}
              </p>
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
        break;
      case 'backendLogLine':
        session.addBackendLogLine(data);
        break;
      default:
        break;
    }
  }
);

eventEmitter.on('getUpdate', () => {
  remote.shell.openExternal(latestUpdate);
  remote.app.exit();
});

ipcRenderer.on('handleLock', () => {
  if (session && loginCounter.isLoggedIn && session.walletPassword !== '') {
    eventEmitter.emit('logOut');
  }
});

ipcRenderer.on('handleSaveAs', () => {
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
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }

  const request = { notify: true, savePath };
  ipcRenderer.send('fromFrontend', 'saveWalletAs', request);
});

ipcRenderer.on('exportToCSV', () => {
  if ((session && !session.wallet) || !loginCounter.isLoggedIn) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  if (session) {
    const options = {
      defaultPath: remote.app.getPath('documents'),
      filters: [
        {
          name: 'CSV Text File',
          extensions: ['csv']
        }
      ]
    };
    const savePath = remote.dialog.showSaveDialog(null, options);
    if (savePath === undefined) {
      return;
    }
    log.debug(`Exporting transactions to csv file at ${savePath}`);
    if (session) {
      session.exportToCSV(savePath);
      const message = (
        <div>
          <center>
            <p className={`subtitle ${textColor}`}>CSV Exported!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Your transaction history has been exported to a .csv file at
            {savePath}
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
    }
  }
});

eventEmitter.on('sendNotification', function sendNotification(amount) {
  const { notifications } = config;

  if (notifications) {
    const notif = new window.Notification('Transaction Received!', {
      body: `${il8n.just_received} ${amount} ${il8n.TRTL}`
    });
    if (notif) {
      log.debug(`Sent notification: You've just received ${amount} TRTL.`);
    }
  }
});

ipcRenderer.on('handleOpen', handleOpen);
eventEmitter.on('handleOpen', handleOpen);

function handleAbout() {
  remote.shell.openExternal(
    'http://github.com/turtlecoin/turtle-wallet-proton#readme'
  );
}

function handleHelp() {
  remote.shell.openExternal('https://discord.gg/P7urHQs');
}

function handleIssues() {
  remote.shell.openExternal(
    'https://github.com/turtlecoin/turtle-wallet-proton/issues'
  );
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
  if (!session) {
    return;
  }

  const secret = getWalletSecret();

  clipboard.writeText(secret);
}

export function backupToFile(wallet?: any) {
  if (!session && !wallet) {
    return;
  }

  const secret = getWalletSecret(wallet || undefined);

  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'Text File',
        extensions: ['txt']
      }
    ]
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }

  fs.writeFile(savePath, secret, error => {
    if (error) {
      throw error;
    }
  });
}

function getWalletSecret(wallet?: any) {
  const walletToBackup = wallet || session.wallet;

  const publicAddress = walletToBackup.getPrimaryAddress();
  const [
    privateSpendKey,
    privateViewKey
  ] = walletToBackup.getPrimaryAddressPrivateKeys();
  // eslint-disable-next-line prefer-const
  let [mnemonicSeed, err] = walletToBackup.getMnemonicSeed();
  if (err) {
    if (err.errorCode === 41) {
      mnemonicSeed = '';
    } else {
      throw err;
    }
  }

  const secret =
    // eslint-disable-next-line prefer-template
    publicAddress +
    `\n\n${il8n.private_spend_key_colon}\n\n` +
    privateSpendKey +
    `\n\n${il8n.private_view_key_colon}\n\n` +
    privateViewKey +
    (mnemonicSeed !== '' ? `\n\n${il8n.mnemonic_seed_colon}\n\n` : '') +
    mnemonicSeed +
    `\n\n${il8n.please_save_your_keys}`;

  return secret;
}

function handleBackup() {
  if ((session && !session.wallet) || !loginCounter.isLoggedIn) {
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
function handleOpen() {
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const getPaths = remote.dialog.showOpenDialog(null, options);
  if (getPaths === undefined) {
    return;
  }
  reInitWallet(getPaths[0]);
}

export function reInitWallet(walletPath: string) {
  ipcRenderer.send('fromFrontend', 'openNewWallet', undefined);
  session.modifyConfig('walletFile', walletPath);
  ipcRenderer.send('fromFrontend', 'config', config);
  session = new WalletSession();
  loginCounter = new LoginCounter();
  eventEmitter.emit('goToLogin');
  eventEmitter.emit('refreshLogin');
}