// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import crypto from 'crypto';
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import ReactTooltip from 'react-tooltip';
import Configure from '../../Configure';

import {
  createIntegratedAddress,
  validatePaymentID
} from 'turtlecoin-wallet-backend';
import { session, il8n, loginCounter, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType } from '../utils/utils';

type Props = {
  copyToClipboard: string => void
};

type State = {
  darkMode: boolean,
  sessionAddress: string,
  paymentID: string,
  usingIntegratedAddress: boolean,
  paymentIDHighlight: string,
  masterSwitch: boolean,
  pageAnimationIn: string
};

export default class Receive extends Component<Props, State> {
  props: Props;

  state: State;

  ref: any;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: config.darkMode,
      sessionAddress: session.getPrimaryAddress(),
      paymentID: '',
      usingIntegratedAddress: false,
      paymentIDHighlight: '',
      masterSwitch: false,
      pageAnimationIn: loginCounter.getAnimation('/receive')
    };
    this.handleCopiedTip = this.handleCopiedTip.bind(this);
    this.generateIntegratedAddress = this.generateIntegratedAddress.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handlePaymentIDChange = this.handlePaymentIDChange.bind(this);
    this.ref = null;
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleCopiedTip = () => {
    ReactTooltip.show(this.ref);
    setTimeout(() => {
      ReactTooltip.hide(this.ref);
    }, 500);
  };

  generateIntegratedAddress = (specifiedID?: string) => {
    const paymentID = specifiedID || crypto.randomBytes(32).toString('hex');
    const integratedAddress = createIntegratedAddress(
      session.getPrimaryAddress(),
      paymentID,
	  Configure
    );
    this.setState({
      masterSwitch: true,
      paymentIDHighlight: 'is-success',
      usingIntegratedAddress: true,
      sessionAddress: integratedAddress,
      paymentID
    });
  };

  resetForm = () => {
    this.setState({
      usingIntegratedAddress: false,
      sessionAddress: session.getPrimaryAddress(),
      paymentID: ''
    });
  };

  handlePaymentIDChange = (event: any) => {
    this.setState({
      paymentIDHighlight: ''
    });
    const enteredID = event.target.value;
    this.setState({
      paymentID: enteredID
    });
  };

  handleIDSubmit = (event: any) => {
    event.preventDefault();
    const { paymentID } = this.state;
    const { errorCode } = validatePaymentID(paymentID);
    if (errorCode === 0) {
      this.generateIntegratedAddress(paymentID);
      this.setState({
        paymentIDHighlight: 'is-success'
      });
    } else {
      this.setState({
        paymentIDHighlight: 'is-danger'
      });
    }
  };

  render() {
    const { copyToClipboard } = this.props;
    const {
      darkMode,
      sessionAddress,
      paymentID,
      usingIntegratedAddress,
      paymentIDHighlight,
      masterSwitch,
      pageAnimationIn
    } = this.state;
    const {
      backgroundColor,
      textColor,
      toolTipColor,
      elementBaseColor
    } = uiType(darkMode);

    const copiedTip = 'Copied!';

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor} hide-scrollbar`}>
          <ReactTooltip
            type={toolTipColor}
            multiline
            place="top"
            effect="solid"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor} ${pageAnimationIn}`}>
            <div className="columns">
              <div className="column is-three-quarters">
                <form>
                  <div className="field">
                    <label
                      className={`label ${textColor}`}
                      htmlFor="receiveaddress"
                    >
                      {il8n.receiving_address}
                      <textarea
                        className="textarea is-family-monospace is-large no-resize"
                        rows="6"
                        value={sessionAddress}
                        readOnly
                      />
                    </label>
                  </div>
                  <div className="field">
                    <div className="buttons">
                      <button
                        // eslint-disable-next-line no-return-assign
                        ref={ref => (this.ref = ref)}
                        type="button"
                        className="button is-success is-large"
                        onClick={() => {
                          copyToClipboard(sessionAddress);
                          this.handleCopiedTip();
                        }}
                        data-tip={copiedTip}
                        data-event="none"
                        data-effect="float"
                      >
                        <span className="icon is-small">
                          <i className="fa fa-clipboard" />
                        </span>
                        &nbsp;&nbsp;{il8n.copy_to_clipboard}
                      </button>
                      <button
                        type="button"
                        className="button is-warning is-large"
                        onClick={() => this.generateIntegratedAddress()}
                      >
                        <span className="icon is-small">
                          <i className="fas fa-user" />
                        </span>
                        &nbsp;&nbsp;Create Integrated Address
                      </button>
                      <button
                        type="button"
                        className={`button is-large ${elementBaseColor}`}
                        onClick={this.resetForm}
                      >
                        <span className="icon is-small">
                          <i className="fa fa-undo" />
                        </span>
                        &nbsp;&nbsp;Reset
                      </button>
                    </div>
                  </div>
                </form>
                <br />
                {usingIntegratedAddress && (
                  <div className="slide-in-left">
                    <form onSubmit={this.handleIDSubmit}>
                      <p className={`help ${textColor}`}>
                        Payment ID used for Generation:
                      </p>
                      <div className="field has-addons is-expanded">
                        <div className="control is-expanded">
                          <input
                            className={`input ${paymentIDHighlight} is-family-monospace`}
                            value={paymentID}
                            onChange={this.handlePaymentIDChange}
                          />
                        </div>
                        <div className="control">
                          <button type="submit" className="button is-success">
                            <span className="icon is-small">
                              <i className="fa fa-flask" />
                            </span>
                            &nbsp;&nbsp;Change
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
                {!usingIntegratedAddress && masterSwitch && (
                  <div className="slide-out-left">
                    <form onSubmit={this.handleIDSubmit}>
                      <p className={`help ${textColor}`}>
                        Payment ID used for Generation:
                      </p>
                      <div className="field has-addons is-expanded">
                        <div className="control is-expanded">
                          <input
                            className={`input ${paymentIDHighlight} is-family-monospace`}
                            value={paymentID}
                            onChange={this.handlePaymentIDChange}
                          />
                        </div>
                        <div className="control">
                          <button type="submit" className="button is-success">
                            <span className="icon is-small">
                              <i className="fa fa-flask" />
                            </span>
                            &nbsp;&nbsp;Generate
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              <div className="column">
                <div className="field">
                  <p className={`has-text-weight-bold ${textColor}`}>
                    {il8n.qr_code}
                  </p>
                  <div className="box has-background-light">
                    <center>
                      <span>
                        <QRCode
                          value={sessionAddress}
                          renderAs="svg"
                          bgColor="#f5f5f5"
                          size={200}
                        />
                      </span>
                    </center>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
