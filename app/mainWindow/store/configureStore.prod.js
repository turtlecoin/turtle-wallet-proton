// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

/* eslint-disable header/header */

import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { createHashHistory } from "history";
import { routerMiddleware } from "connected-react-router";
import createRootReducer from "../reducers";
import type { counterStateType } from "../reducers/types";

const history = createHashHistory();
const rootReducer = createRootReducer(history);
const router = routerMiddleware(history);
const enhancer = applyMiddleware(thunk, router);

function configureStore(initialState?: counterStateType) {
    return createStore(rootReducer, initialState, enhancer);
}

export default { configureStore, history };
