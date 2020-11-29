// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import { loginCounter } from "../index";
import SyncStatus from "./SyncStatus";
import Balance from "./Balance";
import NodeFee from "./NodeFee";
import { uiType } from "../utils/utils";

type Location = {
    hash: string,
    pathname: string,
    search: string
};

type Props = {
    location: Location,
    darkMode: boolean
};

type State = {
    navBarCount: number
};

class BottomBar extends Component<Props, State> {
    props: Props;

    state: State;

    constructor(props?: Props) {
        super(props);
        this.state = {
            navBarCount: loginCounter.navBarCount
        };
    }

    componentDidMount() {}

    componentWillUnmount() {}

    render() {
        // prettier-ignore
        const { darkMode } = this.props;
        const { navBarCount } = this.state;
        const { toolTipColor } = uiType(darkMode);

        return (
            <div
                className={
                    // eslint-disable-next-line no-nested-ternary
                    darkMode
                        ? navBarCount > 0
                            ? "footerbar has-background-black noselect"
                            : "footerbar-slideup has-background-black noselect"
                        : navBarCount > 0
                        ? "footerbar has-background-light noselect"
                        : "footerbar-slideup has-background-light noselect"
                }
            >
                <ReactTooltip
                    effect="solid"
                    type={toolTipColor}
                    multiline
                    place="top"
                />
                {loginCounter.isLoggedIn && (
                    <div className="field is-grouped is-grouped-multiline is-grouped-right">
                        <NodeFee size="is-large" darkMode={darkMode} />
                        <SyncStatus size="is-large" darkMode={darkMode} />
                        <Balance size="is-large" darkMode={darkMode} />
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(BottomBar);
