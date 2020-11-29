// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from "redux";

export type counterStateType = {
    +counter: number
};

export type Action = {
    +type: string
};

export type GetState = () => counterStateType;

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<GetState, Action>;
