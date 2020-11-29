---
name: Release candidate
about: Open a new RC checklist issue.
labels: "release candidate"
---

# Release Candidate

## System Info:

<b>OS Used for Tests:</b> <!-- Enter your OS e.g. Gentoo Linux -->

## Creation

-   [ ] Loads the internal config when local config not present

-   [ ] Can create a wallet

-   [ ] Can import a wallet with keys

-   [ ] Can import a wallet with seed

-   [ ] Import scan height exact height works

## Wallet

### General Operation

-   [ ] Wallet can sync

-   [ ] Wallet can receive a transaction

-   [ ] Coin price is loaded from API

-   [ ] Notifications are received when transaction is received (if enabled)

-   [ ] Wallet sync process is saved on close

-   [ ] Can login with password

-   [ ] Lock button works

-   [ ] Lock button only shows up when password enabled

-   [ ] All operations in the native menus work

-   [ ] Operations in the native menu that should require login do not work unless logged in

-   [ ] Changing password works

### Backup

-   [ ] Seed is not displayed when wallet is not mnemonic

### Transferring

-   [ ] Wallet can send a transaction

-   [ ] Balance is correctly locked after transaction

-   [ ] Cannot send negative amount

-   [ ] Network fee is correctly displayed

-   [ ] Receiver receives transaction

## Transactions Screen

-   [ ] Incoming transactions are displayed

-   [ ] Outgoing transactions are displayed

-   [ ] Transaction extended details are correct

-   [ ] Can view transaction on block explorer

-   [ ] Timestamps of transactions are correct

## Send Screen

-   [ ] Send all works

-   [ ] Generate random payment ID works

## Receive Screen

-   [ ] Copy to clipboard works

-   [ ] Generate integrated address works

-   [ ] Defining a custom payment ID and generating integrated address works

## Address Book Screen

-   [ ] Can add a contact via address book screen

-   [ ] Cannot create an existing contact

-   [ ] Contacts are retained after closing application

-   [ ] Can send to specific contact from address book screen (paper plane icon)

-   [ ] Can delete contact

## Terminal Screen

-   [ ] Displays backend log if loglevel is not DISABLED

-   [ ] Displays TurtleCoind log output if a log file is selected and tail is enabled

## Search Screen (access by searching at the top right)

-   [ ] Can search for an address book contact

-   [ ] Can search for transaction hash

-   [ ] Can search for a payment ID

-   [ ] Can search for a block height

-   [ ] Can search for settings **(if some keyword does not turn up a result you'd expect, please let me know so I can add it as a keyword)**

## Settings

-   [ ] Preferences are loaded when closing/reopening

-   [ ] Wallet remembers last settings page and opens it again (unless navigating from searched setting)

### Node Settings

-   [ ] Changing node works

-   [ ] Tailing turtlecoind log file works

### Wallet Settings

-   [ ] Reset from scan height works

-   [ ] Reset from scan height of zero works

-   [ ] Scan coinbase transaction toggle works

-   [ ] Changing walletbackend loglevel works

### Display Settings

-   [ ] Currency swapping works correctly (click your balance to toggle currencies)

-   [ ] Light mode works

-   [ ] Dark mode works

### Security Settings

-   [ ] Setting autolock interval works

-   [ ] Disabling autolock works

-   [ ] Backup button triggers backup modal

-   [ ] Change wallet password navigates to change password screen

## Platform Settings

-   [ ] Disabling notifications works correctly

-   [ ] Close to tray toggle works

```text
Template (c) zpalmtree 2019-2019, (c) ExtraHash 2019-2019
original found here: https://github.com/turtlecoin/turtlecoin-mobile-wallet/blob/master/.github/ISSUE_TEMPLATE/release-testing.md
```
