// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import {
    Daemon,
    WalletBackend,
    LogLevel,
    prettyPrintAmount,
    WalletErrorCode
} from "turtlecoin-wallet-backend";
import log from "electron-log";
import { ipcRenderer } from "electron";
import { createObjectCsvWriter } from "csv-writer";
import { atomicToHuman, convertTimestamp } from "../mainWindow/utils/utils";
import { remote } from "electron";
import Configure from "../configure";
import TransportNodeHID from "@ledgerhq/hw-transport-node-hid";

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default class Backend {
    notifications: boolean;

    daemon: Daemon;

    daemonHost: string;

    daemonPort: number;

    walletFile: string;

    walletPassword: string = "";

    wallet: any;

    walletActive: boolean = false;

    lastTxAmountRequested: number = 50;

    blocksSinceLastSave: number = 0;

    transactionCount: number = 0;

    waitingOnLedger: boolean;

    saveInterval: IntervalID = setInterval(
        this.saveWallet.bind(this),
        1000 * 60 * 5,
        false
    );

    constructor(config: any): Backend {
        this.notifications = config.notifications;
        this.daemonHost = config.daemonHost;
        this.daemonPort = config.daemonPort;
        this.walletFile = config.walletFile;
        this.logLevel = config.logLevel;
        this.daemon = new Daemon(this.daemonHost, this.daemonPort);
        this.waitingOnLedger = false;
    }

    setNotifications(status: boolean) {
        this.notifications = status;
    }

    setDaemon(daemon: Daemon): void {
        this.daemon = daemon;
    }

    getDaemon(): Daemon {
        return this.daemon;
    }

    setWalletPassword(password: string): void {
        this.walletPassword = password;
    }

    getWalletPassword(): string {
        return this.walletPassword;
    }

    getNodeFee(): void {
        this.send("nodeFee", this.wallet.getNodeFee()[1]);
    }

    send(type: string, data: any) {
        if (typeof data === "object") {
            // eslint-disable-next-line no-restricted-syntax
            for (const key in data) {
                if (typeof data[key] === "function") {
                    // eslint-disable-next-line no-param-reassign
                    delete data[key];
                }
            }
        }
        log.debug({ type, data });
        ipcRenderer.send("fromBackend", type, data);
    }

    getWalletActive(): boolean {
        return this.walletActive;
    }

    setWalletActive(state: boolean): void {
        this.walletActive = state;
    }

    getLastTxAmountRequested(): boolean {
        return this.lastTxAmountRequested;
    }

    setLastTxAmountRequested(amount: number): void {
        this.lastTxAmountRequested = amount;
    }

    evaluateLogLevel(logLevel: string): LogLevel {
        switch (logLevel) {
            case "DEBUG":
                return LogLevel.DEBUG;
            case "ERROR":
                return LogLevel.ERROR;
            case "INFO":
                return LogLevel.INFO;
            case "WARNING":
                return LogLevel.WARNING;
            case "TRACE":
                return LogLevel.TRACE;
            default:
                return LogLevel.DISABLED;
        }
    }

    async exportToCSV(savePath: string) {
        const rawTransactions = await this.getFormattedTransactions(
            undefined,
            undefined,
            true
        );
        const csvWriter = createObjectCsvWriter({
            path: savePath,
            header: [
                { id: "date", title: "Date" },
                { id: "blockHeight", title: "Block Height" },
                { id: "transactionHash", title: "Transaction Hash" },
                { id: "pid", title: "Payment ID" },
                { id: "amount", title: "Amount" },
                { id: "bal", title: "balance" }
            ]
        });
        const csvData = rawTransactions.map(item => {
            return {
                date: convertTimestamp(item[0]),
                blockHeight: item[4],
                transactionHash: item[1],
                pid: item[5],
                amount: atomicToHuman(item[2], true),
                bal: atomicToHuman(item[3], true)
            };
        });
        await csvWriter.writeRecords(csvData);
    }

    setScanCoinbaseTransactions(value: boolean) {
        this.wallet.scanCoinbaseTransactions(value);
    }

    setenableAutoOptimization(value: boolean) {
        this.wallet.enableAutoOptimization(value);
    }

    async sendTransaction(hash: string): void {
        /* Wait for UI to load before blocking thread */
        await delay(500);

        const result = await this.wallet.sendPreparedTransaction(hash);

        if (result.success) {
            console.log(
                `Sent transaction, hash ${
                    result.transactionHash
                }, fee ${prettyPrintAmount(result.fee, Configure)}`
            );
            const response = {
                status: "SUCCESS",
                hash: result.transactionHash,
                error: undefined
            };
            this.send("sendTransactionResponse", response);
            await this.getTransactions(this.getLastTxAmountRequested() + 1);
        } else {
            /* TODO: Optionally allow retries in case of network error? */
            this.wallet.deletePreparedTransaction(hash);
            console.log(
                `Failed to send transaction: ${result.error.toString()}`
            );
            result.error.errorString = result.error.toString();
            const response = {
                status: "FAILURE",
                hash: undefined,
                error: result.error
            };
            this.send("sendTransactionResponse", response);
        }
    }

    async prepareTransaction(transaction): Promise<void> {
        const [unlockedBalance] = await this.wallet.getBalance();

        const networkHeight: number = this.daemon.getNetworkBlockCount();

        const [, nodeFee] = this.wallet.getNodeFee();

        let txFee = Configure.minimumFee;

        const { address, amount, paymentID, sendAll } = transaction;

        const payments = [];

        if (sendAll) {
            payments.push([
                address,
                networkHeight >= Configure.feePerByteHeight
                    ? 1
                    : unlockedBalance -
                      nodeFee -
                      txFee /* Amount does not matter for sendAll destination */
            ]);
        } else {
            payments.push([address, amount]);
        }

        const result = await this.wallet.sendTransactionAdvanced(
            payments, // destinations
            undefined, // mixin
            networkHeight >= Configure.feePerByteHeight
                ? undefined
                : { isFixedFee: true, fixedFee: txFee }, // fee
            paymentID, // paymentID
            undefined, // subwalletsToTakeFrom
            undefined, // changeAddress
            false, // relayToNetwork
            sendAll // sendAll
        );

        log.info(result);

        if (result.success) {
            let actualAmount = amount;

            if (networkHeight >= Configure.feePerByteHeight) {
                txFee = result.fee;
            }

            if (sendAll) {
                let transactionSum = 0;

                /* We could just get the sum by calling getBalance.. but it's
                 * possibly just changed. Safest to iterate over prepared
                 * transaction and calculate it. */
                for (const input of result.preparedTransaction.inputs) {
                    transactionSum += input.input.amount;
                }
                actualAmount = transactionSum - txFee - nodeFee;
            }
            const response = {
                status: "SUCCESS",
                hash: result.transactionHash,
                address,
                paymentID,
                amount: actualAmount,
                fee: txFee,
                nodeFee,
                error: undefined
            };
            this.send("prepareTransactionResponse", response);
            await this.getTransactions(this.getLastTxAmountRequested() + 1);
        } else {
            console.log(
                `Failed to send transaction: ${result.error.toString()}`
            );
            result.error.errorString = result.error.toString();
            const response = {
                status: "FAILURE",
                hash: undefined,
                address,
                paymentID,
                amount,
                fee: txFee,
                nodeFee,
                error: result.error
            };
            this.send("prepareTransactionResponse", response);
        }
    }

    verifyPassword(password: string): void {
        this.send("authenticationStatus", password === this.walletPassword);
    }

    changePassword(passwords: any): void {
        const { oldPassword, newPassword } = passwords;
        let response;
        if (this.getWalletPassword() !== oldPassword) {
            response = { status: "FAILURE", error: "AUTHERROR" };
        } else {
            this.setWalletPassword(newPassword);
            const saved = this.saveWallet(false);
            if (saved) {
                response = { status: "SUCCESS", error: undefined };
            } else {
                response = { status: "FAILURE", error: "SAVEERROR" };
            }
        }
        this.send("passwordChangeResponse", response);
    }

    async rescanWallet(height: number) {
        await this.wallet.reset(height);
        this.saveWallet(false);
        this.send("rescanResponse", height);
    }

    async getFormattedTransactions(
        startIndex?: number,
        numTransactions?: number,
        includeFusions?: boolean
    ): any[] {
        const rawTransactions = await this.wallet.getTransactions(
            startIndex,
            numTransactions,
            includeFusions || false
        );
        const [unlockedBalance, lockedBalance] = await this.wallet.getBalance();
        let balance = parseInt(unlockedBalance + lockedBalance, 10);
        const transactions = [];

        for (const [index, tx] of rawTransactions.entries()) {
            transactions.push([
                tx.timestamp,
                tx.hash,
                tx.totalAmount(),
                balance,
                tx.blockHeight,
                tx.paymentID,
                index,
                tx.fee,
                tx.unlockTime
            ]);
            balance -= parseInt(tx.totalAmount(), 10);
        }
        return transactions;
    }

    async stop(isShuttingDown: boolean) {
        if (this.wallet) {
            this.saveWallet(false);
            clearInterval(this.saveInterval);
            this.wallet.stop();
        }
        if (this.transport && !isShuttingDown) {
          await this.transport.close();

          // remote.app.relaunch();
          // remote.app.quit();
        }
        if (isShuttingDown) {
            ipcRenderer.send("backendStopped");
        }
    }

    async getTransactions(displayCount: number): void {
        this.setLastTxAmountRequested(displayCount);
        const getTx = await this.getFormattedTransactions(
            0,
            displayCount,
            true
        );
        this.send("transactionList", getTx);
    }

    getTransactionCount(): void {
        this.send("transactionCount", this.transactionCount);
    }

    async getBalance(): void {
        console.log(`balance: ${this.wallet.getBalance()}`);
        this.send("balance", await this.wallet.getBalance());
    }

    saveWallet(notify: boolean, path?: string): boolean {
        if (!this.getWalletActive()) {
            return;
        }
        const status = this.wallet.saveWalletToFile(
            path || this.walletFile,
            this.walletPassword
        );

        if (notify) {
            this.send("saveWalletResponse", status);
        }
        return status;
    }

    async transactionSearch(query: string) {
        const transactions = await this.wallet.getTransactions();
        const possibleTransactionValues = ["blockHeight", "hash", "paymentID"];
        const transactionResults = possibleTransactionValues.map(value => {
            return this.search(query, transactions, value);
        });

        let sanitizedResults = [];
        /* the search function returns a separate array of results for each
    value searched, we need to concat them together with spread */
        for (let i = 0; i < transactionResults.length; i++) {
            sanitizedResults = [...transactionResults[i], ...sanitizedResults];
        }

        this.send("transactionSearchResponse", sanitizedResults);
    }

    search(
        searchedValue: any,
        arrayToSearch: any[],
        objectPropertyName: string
    ) {
        const resultsToReturn = [];
        for (let i = 0; i < arrayToSearch.length; i++) {
            // will resolve to true if the selected value contains the substring, case insensitive
            if (
                String(arrayToSearch[i][objectPropertyName])
                    .toUpperCase()
                    .includes(searchedValue.toUpperCase())
            ) {
                /* we have to disable this because the function gets lost
        when we send the object over ipc */

                // eslint-disable-next-line no-param-reassign
                arrayToSearch[i].totalTxAmount = arrayToSearch[i].totalAmount();

                // we need to delete the function afterwards because of
                // electron 9's new serialization code
                // https://www.electronjs.org/docs/breaking-changes#behavior-changed-values-sent-over-ipc-are-now-serialized-with-structured-clone-algorithm

                // eslint-disable-next-line no-param-reassign
                delete arrayToSearch[i].totalAmount;

                resultsToReturn.push(arrayToSearch[i]);
            }
        }
        return resultsToReturn;
    }

    async changeNode(nodeInfo: any): void {
        const { host, port } = nodeInfo;
        this.setDaemon(new Daemon(host, port));
        await this.wallet.swapNode(this.daemon);
        this.getConnectionInfo();
        this.getNodeFee();
    }

    getConnectionInfo(): void {
        this.send(
            "daemonConnectionInfo",
            this.wallet.getDaemonConnectionInfo()
        );
    }

    setLogLevel(logLevel: string): void {
        this.logLevel = logLevel;
        this.wallet.setLogLevel(this.evaluateLogLevel(this.logLevel));
    }

    async walletInit(wallet: any): Promise<void> {
        this.wallet = wallet;
        this.setLogLevel(this.logLevel);
        this.wallet.on(
            "heightchange",
            async (
                walletBlockCount,
                localDaemonBlockCount,
                networkBlockCount
            ) => {
                this.send("syncStatus", [
                    walletBlockCount,
                    localDaemonBlockCount,
                    networkBlockCount
                ]);
                if (
                    networkBlockCount !== 0 &&
                    walletBlockCount !== 0 &&
                    networkBlockCount - walletBlockCount < 40
                ) {
                    this.send("balance", await this.wallet.getBalance());
                }
            }
        );

        this.wallet.on("transaction", async () => {
            this.getTransactionCount();
            await this.getTransactions(this.getLastTxAmountRequested() + 1);
            await this.getBalance();
        });

        this.wallet.on("incomingtx", transaction => {
            log.info(transaction);
            if (this.notifications) {
                // eslint-disable-next-line no-new
                new window.Notification("Transaction Received!", {
                    body: `You've just received ${atomicToHuman(
                        transaction.totalAmount(),
                        true
                    )} ${Configure.ticker}.`
                });
            }
        });

        this.wallet.on("user_confirm", () => {
            log.info("Reached the confirm event");
            this.waitingOnLedger = true;
            this.send("ledgerPrompt");
        });

        this.wallet.on("transport_receive", data => {
            log.debug("TRANSPORT RECV", data);
            if (this.waitingOnLedger) {
                this.waitingOnLedger = false;
                this.send("ledgerPromptClose");
            }
        });

        this.wallet.on("transport_send", data => {
            log.debug("TRANSPORT SEND", data);
        });

        this.setWalletActive(true);
        this.send("syncStatus", this.wallet.getSyncStatus());
        this.send("primaryAddress", this.wallet.getPrimaryAddress());
        this.send(
            "transactionList",
            await this.getFormattedTransactions(0, 50, true)
        );
        this.getTransactionCount();
        this.send("balance", await this.wallet.getBalance());
        this.send("walletActiveStatus", true);
        this.send("authenticationStatus", true);
        await this.wallet.start();
        this.send(
            "daemonConnectionInfo",
            this.wallet.getDaemonConnectionInfo()
        );
        this.getNodeFee();
    }

    async getMnemonic(): string {
        // eslint-disable-next-line prefer-const
        let [mnemonicSeed, err] = await this.wallet.getMnemonicSeed();
        if (err) {
            if (err.errorCode === 41) {
                mnemonicSeed = "";
            } else {
                throw err;
            }
        }
        return mnemonicSeed;
    }

    async getSecret(): string {
        const publicAddress = this.wallet.getPrimaryAddress();
        const [
            privateSpendKey,
            privateViewKey
        ] = this.wallet.getPrimaryAddressPrivateKeys();
        // eslint-disable-next-line prefer-const

        const mnemonicSeed = await this.getMnemonic();

        const secret =
            // eslint-disable-next-line prefer-template
            publicAddress +
            `\n\nPrivate Spend Key:\n\n` +
            privateSpendKey +
            `\n\nPrivate View Key:\n\n` +
            privateViewKey +
            (mnemonicSeed !== "" ? `\n\nMnemonic Seed:\n\n` : "") +
            mnemonicSeed +
            `\n\nPlease save these keys safely and securely. \nIf you lose your keys, you will not be able to recover your funds.`;

        return secret;
    }

    async startWallet(password: string): Promise<void> {
        log.info("Attempting to start wallet.");

        this.walletPassword = password;
        const [openWallet, error] = await WalletBackend.openWalletFromFile(
            this.daemon,
            this.walletFile,
            this.walletPassword,
            Configure
        );

        if (!error) {
            this.walletInit(openWallet);
        } else if (error.errorCode === WalletErrorCode.WRONG_PASSWORD) {
            this.send("authenticationStatus", false);
        } else if (
            error.errorCode === WalletErrorCode.LEDGER_TRANSPORT_REQUIRED
        ) {
            log.info("ledger wallet detected.");
            const devices = await TransportNodeHID.list();

            console.log(devices);

            if (devices.length === 0) {
                const noLedgerErr = {
                  errorString: "This is a ledger enabled wallet. You must have a ledger plugged in."
                }
                this.send("authenticationError", noLedgerErr);
                return;
            }
            try {
              this.transport = await TransportNodeHID.create();
              this.send("ledgerPrompt");
              const [
                  ledgerWallet,
                  error
              ] = await WalletBackend.openWalletFromFile(
                  this.daemon,
                  this.walletFile,
                  this.walletPassword,
                  { ...Configure, ledgerTransport: this.transport }
              );

              console.log("transport created", this.transport);

              this.walletInit(ledgerWallet);
            } catch(err) {
              const ledgexErr = {
                errorString: "There was a problem initializing the connection with the ledger. "+err.toString()
              }
              this.send("authenticationError", ledgexErr);
              return;
            }

        } else {
            error.errorString = error.toString();
            console.log(error.errorCode, error.toString());
            this.send("authenticationError", error);
        }
    }
}
