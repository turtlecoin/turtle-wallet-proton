// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

/* eslint-disable header/header */

import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import counter from "./receive";

export default function createRootReducer(history: History) {
    return combineReducers({
        router: connectRouter(history),
        counter
    });
}
