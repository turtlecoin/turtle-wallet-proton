// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { INCREMENT_COUNTER, DECREMENT_COUNTER } from "../actions/receive";
import type { Action } from "./types";

export default function counter(state: number = 0, action: Action) {
    switch (action.type) {
        case INCREMENT_COUNTER:
            return state + 1;
        case DECREMENT_COUNTER:
            return state - 1;
        default:
            return state;
    }
}
