# Changelog

## v1.1.1

-   fixes a bug where the "save as" command does not append the .wallet extension
-   fixes a bug where the user could still save the wallet in the install directory by placing it in a subfolder, causing the wallet file to be wiped on wallet upgrade
-   electron-builder updated for MacOS Catalina compatability
-   updates GH builds to use latest OS and cache the dependencies
-   upgrades the wallet backend to alleviate a bug that was (possibly) effecting sending transactions
-   Slight configuration change in an attempt to make the sync process not effect the GUI responsiveness so much

## v1.1.0

-   Adds a new method of making new wallets, which is much more interactive, and ensures the user backs up their seed before they use their wallet.
-   Adds an addressbook.
-   Makes several updates to the send form to integrate with the new address book. You can now enter a contact name or turtlecoin address in the send field, and it will autosuggest matching contacts as you type.
-   Adds a search feature. Currently you can search contacts (name or address), transactions (hash, block height, or payment ID), and settings (name, description, or keywords).
-   Fixes a bug that would cause the wallet syncing to slow drastically when window was hidden or minimized.
-   Fixes a bug that would cause the user to be unable to backup the wallet if it was a non-deterministic wallet.
-   Fixes a but that would allow exporting transactions as CSV when the wallet was locked.
-   Switches the node changer to use the built in swapNode() method.
-   Removes the ability to actually launch the TurtleCoind process, but still allows tailing a log file: I found that actually having Proton launch the child process itself was not the functionality I was really looking for, I was just looking to be able to view my terminal output in Proton for both the daemon and the backend. So, I removed the launching of the process, but it still allows you to set a log file location and view the tail of the text file in the Terminal tab.
-   Switches to GitHub actions for push and PR building / release deployment rather than using travis (much faster, windows build is ~6 min compared to almost 30)

## v1.0.0

-   There is user action required for this update. The wallet open dialog now **only looks for wallet files ending in the `.wallet` extension,** as well as uses this extension by default when saving. If your wallet file does not have this extension, you will not be able to see it in the open dialog. **You must manually rename your wallet file and give it the proper extension `.wallet`**.
-   Adds quite a few nifty animations.
-   Adds integrated address generation on the Receive screen.
-   Fixes a nasty memory leak that somehow I did not notice on the last version.
-   Fixes some UX bugs that were missed from transitioning to non-blocking modal components rather than native dialogs.
-   Increases the amount of sockets available to request to fix timeout bugs.
-   All drop down menus are now fully searchable, keyboard navigable, and ARIA compliant.
-   WalletBackend logs are now viewable in the terminal tab, and there is a component under Wallet settings that allows you to set the log level.
-   Uncaught errors now display in an error component for the user instead of crashing the renderer process
-   You can now disable and enable notifications in OS Settings.

Also, following this release, Proton will be moving to a **monthly release cycle**. We will have a new version out W1 of each month for you to download, so no more of these incredibly frequent update notifications (apologies if they've been bothersome).

Thanks TurtleCoin community, and please enjoy the new version!

## v0.0.28

-   introduces a non-blocking in-window 'modal' component which replaces all native (thread blocking) dialogs
-   adds a local daemon mode which can be enabled in settings (you must provide a path to turtlecoind)
-   upgrades turtlecoin-wallet-backend for some transaction bugfixes
-   adds some additional dev-only testing actions
-   pulls in source code pro for monospace font on all OS

## v0.0.27

-   reverts the default remote node change from v0.0.26

## v0.0.26

-   transaction errors should now be fixed or at least 95% reduced (thanks zpalm and ibmcd for your assistance troubleshooting)
-   fixes a bug where auto-optimizing was not occurring
-   indicator on the lock screen that your wallet is locked, not just logged out, as well as its sync status
-   ability to disable and configure the time of the autolock (in the settings menu)
-   ability to display transactions in fiat value (click on your balance on the bottom right)
-   completely redesigned settings menu
-   "find node" link updated to the new official TurtleCoin node finder (https://explorer.turtlecoin.lol/nodes.html)
-   some various UI improvements
-   updated to latest version of wallet-backend
-   "test" transaction button for developers (sends a transaction between 0.01 - 1.00 with a fee of 0.1 and a random payment ID to the primary wallet addresss)
-   possibly other things I am forgetting
-   changed default remote node to one run by the developer (as always, you can change the node in settings)

This should hopefully fix most of the transaction issues everybody has been having. There are still times that a daemon is busy syncing and may not respond to your request. In the event of this, you should just wait a little while and retry your request. If it continuosly fails, it is likely an issue with the node, so please select another node.

If you have a wallet with bad inputs, make sure you "rescan" your wallet in settings. This should hopefully be the last time you have to do this, as you should no longer receive bad inputs in your wallet.

Thanks everybody and enjoy the new version.

## v0.0.25

-   Fixes bug where the import seed / key button did not work on the firststartup menu

## v0.0.24

-   new "lock" button in the navbar, allows you to lock your wallet with a password but it still syncs in the background
-   wallet now auto-locks after 15 minutes of inactivity if a password is not enabled
-   new notification when you attempt to send transaction when not synced
-   UI improvements to the sync status, it now stays the same size regardless of state to prevent the growing / shrinking (thanks soregums)
-   closing to tray is now disabled by default and toggleable in settings
-   all strings have been extracted into a separate json file for future ease of translation (thanks root-us3er)
-   Nearly all of the logic for the navigation and darkmode have been rewritten
-   The wallet is now leaner and meaner, with over 4000 lines of code being removed with zero loss of functionality
-   All linting errors have been fixed
-   animation logic has been rewritten and improved

This is a pretty big release, cleaning up the codebase and making it look much nicer and more professional as well as adding some new features. Check it out, hope you enjoy it!

## v0.0.23

-   finishes rewind feature (before you could only press the button to rewind ~day, i forgot to finish the user input height)
-   bumps turtlecoin-wallet-backend version
-   fixes AppImage system icon not working
-   now closes to system tray instead of closing completely on X

## v0.0.22

-   updated balance widget to include visual difference when some of the balance is locked as well as a mouseover event that shows locked / unlocked bal
-   conditional validation for the transaction dialog box
-   fixes a bug that would cause the historical and balance to be incorrectly displayed when a portion of the balane was locked
-   bumps turtlecoin-wallet-backend
-   fixes the send field allowing negative numbers
-   fixes a bug that would cause the send field to add wrong (eg 1 + 0.1 = 1.11)
-   adds aarmv7 / arm64 support
-   drops SNAP releases

## v0.0.21

-   save dialog now defaults to the "my documents" folder instead of the program installation folder
-   on windows, the windows installer was deleting the entire directory when upgrading the application which caused any user wallets stored there to be lost, so I have blacklisted the installation directory and the wallet will no longer allow you to save there
-   adds a visual notification on the login screen if the password is entered incorrectly

## v0.0.20

-   I didn't notice I broke the file > restore menu by updating the close behavior, whoops, this is fixed

## v0.0.19

-   adds some animations to the wallet
-   fixes a bug that caused the autosave on app exit to not function properly
-   sends a native OS notification when you receive a transaction
-   implements an automatic save every few minutes if the wallet is left running
-   windows now has a configurable installer which allows installation in a custom directory or for all users (all users requires administrative permissions)
-   turtlecoin-wallet-backend-js version upgraded, now connects to daemon with KeepAlive = true
-   fixes copy + paste on MacOS
-   various UI improvements

## v0.0.18

-   Fixes a stupid bug where the user is presented with a white screen on initial startup instead of a splash screen

## v0.0.17

-   We've got dark mode! You heard me right, dark mode is now featured. Also some improvements were made to the navbar and the UI as well as some various bugfixes.

## v0.0.16

-   This adds exporting to .csv which was a user requested feature to a new Tools menu
-   also only allows one wallet to be open at a time until I can experiment with the behavior

## v0.0.15

-   bumps turtlecoin-wallet-backend-js dependency to latest version
-   hides the navigation when no wallet is open
-   redirects to the main Wallet page any time after opening a new wallet
-   various bug fixes

## v0.0.14

-   This refactors the code to use the new Daemon() constructor in the wallet-backend library, as well as simplifies the node swapping behavior and adding some pretty little icons to the node selection textbox as well, one of which is animated.

## v0.0.13

-   upgrade the turtlecoin-wallet-backend dependency to fix a bug that was caused by a batch of blocks in the ~200k range, also no longer checks for an update in development mode

## v0.0.12

-   this version brings automatic release building and deployment to both github releases and the snap store. also, it's the first non-beta release.

## v0.0.11-beta

-   adds a rescan wallet item to settings, allowing users to rescan their wallet from a desired block height

## v0.0.10-beta

-   checks on startup to see if there's an updated version and if so prompts to download it

## v0.0.9-beta

-   adds mac support, so we have mac binaries being released for the first time, along with some other small (travis-related) fixes.

## v0.0.8-beta

-   adds some enhancements to the send form, also fixes a bug in the payment ID field

## v0.0.7-beta

-   fix a "bug" where I forgot to update the balance on the navbar on transactions

## v0.0.6-beta

-   add some autosave logic, the wallet now saves to file any time you open a new wallet or close the application automatically

## v0.0.5-beta

-   implement a splash screen when there's not a wallet defined to give the user a choice on what to do on startup rather than auto-creating a wallet

## v0.0.4-beta\*\*

Initial beta release, has basic wallet functionality

-   opening and saving wallets
-   restoring wallets from keys and seed
-   backing up private keys and seed
-   viewing balance and transcations
-   sending transactions
-   changing the connected node
-   changing the wallet password
