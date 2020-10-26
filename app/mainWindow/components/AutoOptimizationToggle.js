// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { config, configManager } from '../index';
import { uiType } from '../utils/utils';

type State = {
  enableAutoOptimization: boolean
};

type Props = {
  darkMode: boolean
};

export default class AutoOptimizationToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      enableAutoOptimization: config.enableAutoOptimization || false
    };
    this.toggleAutoOptimize = this.toggleAutoOptimize.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  toggleAutoOptimize = () => {
    const { enableAutoOptimization } = this.state;
    configManager.modifyConfig(
      'enableAutoOptimization',
      !enableAutoOptimization
    );
    this.setState({
      enableAutoOptimization: !enableAutoOptimization
    });
    ipcRenderer.send(
      'fromFrontend',
      'AutoOptimizationRequest',
      !enableAutoOptimization
    );
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { enableAutoOptimization } = this.state;
    return (
      <div>
        {enableAutoOptimization === false && (
          <span className={textColor}>
            <a
              className="button is-danger"
              onClick={this.toggleAutoOptimize}
              onKeyPress={this.toggleAutoOptimize}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Auto Optimization: <b>Off</b>
          </span>
        )}
        {enableAutoOptimization === true && (
          <span className={textColor}>
            <a
              className="button is-success"
              onClick={this.toggleAutoOptimize}
              onKeyPress={this.toggleAutoOptimize}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Auto Optimization: <b>On</b> &nbsp;&nbsp;
          </span>
        )}
      </div>
    );
  }
}
