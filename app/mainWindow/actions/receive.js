// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { clipboard } from "electron";
import log from "electron-log";
import type { GetState, Dispatch } from "../reducers/types";

export const INCREMENT_COUNTER = "INCREMENT_COUNTER";
export const DECREMENT_COUNTER = "DECREMENT_COUNTER";

export function increment() {
    return {
        type: INCREMENT_COUNTER
    };
}

export function decrement() {
    return {
        type: DECREMENT_COUNTER
    };
}

export function incrementIfOdd() {
    return (dispatch: Dispatch, getState: GetState) => {
        const { counter } = getState();

        if (counter % 2 === 0) {
            return;
        }

        dispatch(increment());
    };
}

export function incrementAsync(delay: number = 1000) {
    return (dispatch: Dispatch) => {
        setTimeout(() => {
            dispatch(increment());
        }, delay);
    };
}

export function copyToClipboard(text: string) {
    return () => {
        log.debug(`Address copied to clipboard ${text}`);
        clipboard.writeText(text);
    };
}
