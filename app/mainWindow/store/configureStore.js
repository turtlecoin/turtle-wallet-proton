// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import configureStoreDev from "./configureStore.dev";
import configureStoreProd from "./configureStore.prod";

const selectedConfigureStore =
    process.env.NODE_ENV === "production"
        ? configureStoreProd
        : configureStoreDev;

export const { configureStore } = selectedConfigureStore;

export const { history } = selectedConfigureStore;
