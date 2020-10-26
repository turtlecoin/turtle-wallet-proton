// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import Select from 'react-select';
import { remote, ipcRenderer } from 'electron';
import { il8n, eventEmitter, session, configManager } from '../index';
import { uiType } from '../utils/utils';
import NodeFee from './NodeFee';
import Configure from '../../Configure';

type Props = {
  darkMode: boolean
};

type State = {
  connectionString: string,
  nodeChangeInProgress: boolean,
  ssl: boolean,
  Selected_Node: string,
  node_NewFee: number
};

export default class NodeChanger extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      connectionString:
        `${session.getDaemonConnectionInfo().host ? (session.getDaemonConnectionInfo().host + ':' +session.getDaemonConnectionInfo().port) : 'Connecting, please wait...'}`,
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl || false,
      Selected_Node: Configure.defaultDaemon,
      Fee: session.getNodeFee() || 0
    };
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.resetConnectionString = this.resetConnectionString.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeListChange = this.handleNodeListChange.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleNodeChangeComplete = this.handleNodeChangeComplete.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('gotDaemonConnectionInfo', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotDaemonConnectionInfo', this.handleNewNode);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
  }

  refreshNodeFee = () => {
    NodeFee.nodeFee = session.getNodeFee() || 0;
  };

  resetConnectionString = () => {
    this.setState({
      connectionString: `${session.getDaemonConnectionInfo().host ? (session.getDaemonConnectionInfo().host + ':' +session.getDaemonConnectionInfo().port) : 'Connecting, please wait...'}`,
      nodeChangeInProgress: false,
      ssl: session.getDaemonConnectionInfo().ssl
    });
  };

  handleNodeInputChange = (event: any) => {
    this.setState({ connectionString: event.target.value.trim() });
  };

  handleNodeListChange = (selectedOptions, data) => {
    this.setState({ selectedOptions });
    this.setState({ connectionString: selectedOptions.label });
  }

  handleNodeChangeInProgress = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined,
      node_NewFee: undefined
    });
  };

  handleNodeChangeComplete = () => {
    this.setState({
      nodeChangeInProgress: false,
      connectionString: `${session.daemonHost}:${session.daemonPort}`,
      ssl: session.daemon.ssl,
      node_NewFee: session.getNodeFee() || 0
    });
    log.debug(`Network Fee ${session.getNodeFee()  || 0}`);
  };

  changeNode = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined
    });
    const { connectionString } = this.state;
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    // eslint-disable-next-line prefer-const
    let [host, port] = connectionString.split(':', 2);
    if (port === undefined) {
      port = Configure.DefaultDaemonRPCPort;
    }
    /* if the daemon entered is the same as the
    one we're connected to, don't do anything */
    if (
      host.trim() === session.getDaemonConnectionInfo().host &&
      port.trim() === String(session.getDaemonConnectionInfo().port)
    ) {
      this.resetConnectionString();
      return;
    }
    if (!Number.isNaN(parseInt(port, 10))) {
      const request = { host, port: parseInt(port, 10) };
      configManager.modifyConfig('daemonHost', host);
      configManager.modifyConfig('daemonPort', parseInt(port, 10));
      ipcRenderer.send('fromFrontend', 'changeNode', request);
    } else {
      this.resetConnectionString();
      const modalMessage = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Port number must be an integer!
          </p>
        </div>
      );
      eventEmitter.emit('openModal', modalMessage, 'OK', null, null);
    }
  };

  handleNewNode = () => {
    this.resetConnectionString();
  };

  render() {
    const { darkMode } = this.props;
    const { textColor, linkColor } = uiType(darkMode);
    const {
      nodeChangeInProgress,
      connectionString,
      ssl,
	  Selected_Node,
	  node_NewFee
    } = this.state;
    return (
      <form onSubmit={this.changeNode}>
        <p className={`has-text-weight-bold ${textColor}`}>
          Remote Node (node:port)
        </p>
        <div className="field has-addons is-expanded">
          <div className="control is-expanded has-icons-left">
            {nodeChangeInProgress === false && (
              <input
                className="input has-icons-left"
                type="text"
                value={connectionString}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.changeNode();
                  }
                }}
                onChange={event => {
                  this.setState({
                    connectionString: event.target.value.trim()
                  });
                }}
              />
            )}
            {ssl === true && (
              <span className="icon is-small is-left">
                <i className="fas fa-lock" />
              </span>
            )}
            {ssl === false && (
              <span className="icon is-small is-left">
                <i className="fas fa-unlock" />
              </span>
            )}
            {nodeChangeInProgress === true && (
              <input
                className="input"
                type="text"
                placeholder="connecting..."
                onChange={this.handleNodeInputChange}
              />
            )}
            {nodeChangeInProgress === true && (
              <span className="icon is-small is-left">
                <i className="fas fa-sync fa-spin" />
              </span>
            )}
			<br />
			<br />
			<p className={`has-text-weight-bold ${textColor}`}>
			  Select a node:
			</p>
			<div style={{width: '350px'}}>
			<Select
			  value={this.state.selectedOptions}
			  onChange={this.handleNodeListChange}
			  options={session.daemons}
			/>
			</div>
          </div>
          {nodeChangeInProgress === true && (
            <div className="control">
              <button className="button is-success is-loading">
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
          {nodeChangeInProgress === false && (
            <div className="control">
              <button className="button is-success" onClick={this.changeNode}>
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
        </div>
      </form>
    );
  }
}
