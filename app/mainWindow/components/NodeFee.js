// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, eventEmitter, il8n } from '../index';
import { atomicToHuman } from '../utils/utils';
import Configure from '../../Configure';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  nodeFee: number,
  connectednode: string
};

export default class NodeFee extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.getNodeFee() || 0,
      connectednode: (session.getDaemonConnectionInfo()) ? (session.getDaemonConnectionInfo().host + ':' + session.getDaemonConnectionInfo().port): 'Connecting, please wait...'
    };
    this.handleNewNodeFee = this.handleNewNodeFee.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotNodeFee', this.handleNewNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotNodeFee', this.handleNewNodeFee);
  }

  handleNewNodeFee = () => {
    this.setState({
      nodeFee: session.getNodeFee(),
      connectednode: (session.getDaemonConnectionInfo()) ? (session.getDaemonConnectionInfo().host + ':' + session.getDaemonConnectionInfo().port): 'Connecting, please wait...'
    });
  };

  render() {
    const { darkMode, size } = this.props;
    const { nodeFee, connectednode } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    if (nodeFee > 0) {
      return (
        <div className="control statusicons">
          <div className="tags has-addons">
            <span className={`tag is-success ${size}`}>{connectednode}</span>
            <span className={`tag ${color} ${size}`}>{il8n.node_fee}</span>
            <span className={`tag is-danger ${size}`}>
              {atomicToHuman(nodeFee, true)} {Configure.ticker}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }
}
