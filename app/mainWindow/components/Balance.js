// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session, il8n, eventEmitter, config, configManager } from '../index';
import { formatLikeCurrency, atomicToHuman } from '../utils/utils';
import Configure from '../../Configure';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  fiatPrice: number,
  displayCurrency: string,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number
};

export default class Balance extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      fiatPrice: session.fiatPrice,
      displayCurrency: config.displayCurrency,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
    };
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.switchCurrency = this.switchCurrency.bind(this);
    this.handleNewBalance = this.handleNewBalance.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('gotNewBalance', this.handleNewBalance);
  }

  componentWillUnmount() {
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('gotNewBalance', this.handleNewBalance);
  }

  handleNewBalance = () => {
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
    });
  };

  switchCurrency = () => {
    const { displayCurrency } = this.state;
    if (displayCurrency === Configure.ticker) {
      this.setState({
        displayCurrency: 'fiat'
      });
      configManager.modifyConfig('displayCurrency', 'fiat');
      eventEmitter.emit('modifyCurrency', 'fiat');
    }
    if (displayCurrency === 'fiat') {
      this.setState({
        displayCurrency: Configure.ticker
      });
      configManager.modifyConfig('displayCurrency', Configure.ticker);
      eventEmitter.emit('modifyCurrency', Configure.ticker);
    }
    ReactTooltip.rebuild();
  };

  render() {
    const { darkMode, size } = this.props;
    const {
      unlockedBalance,
      lockedBalance,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals
    } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    let balanceTooltip;

    if (displayCurrency === Configure.ticker) {
      balanceTooltip =
        `Unlocked: ${atomicToHuman(unlockedBalance, true)} ${Configure.ticker}<br>` +
        `Locked: ${atomicToHuman(lockedBalance, true)} ${Configure.ticker}`;
    } else if (symbolLocation === 'prefix' && displayCurrency === 'fiat') {
      balanceTooltip =
        `Unlocked: ${fiatSymbol}${formatLikeCurrency(
          Number(fiatPrice * atomicToHuman(unlockedBalance, false)).toFixed(
            fiatDecimals
          )
        )}
        <br>` +
        `Locked: ${fiatSymbol}${formatLikeCurrency(
          Number(fiatPrice * atomicToHuman(lockedBalance, false)).toFixed(
            fiatDecimals
          )
        )}
        <br>`;
    } else if (symbolLocation === 'suffix' && displayCurrency === 'fiat') {
      balanceTooltip =
        `Unlocked: ${(
          fiatPrice * atomicToHuman(unlockedBalance, false)
        ).toFixed(fiatDecimals)}${fiatSymbol}
        <br>` +
        `Locked: ${(fiatPrice * atomicToHuman(lockedBalance, false)).toFixed(
          fiatDecimals
        )}${fiatSymbol}`;
    } else {
      balanceTooltip = 'No wallet open!';
    }

    return (
      <div
        className="control statusicons"
        onClick={this.switchCurrency}
        onKeyPress={this.switchCurrency}
        role="button"
        tabIndex={0}
        onMouseDown={event => event.preventDefault()}
      >
        <div className="tags has-addons">
          <span className={`tag ${color} ${size}`}>{il8n.balance_colon}</span>
          {displayCurrency === Configure.ticker && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-warning ${size}`
                  : `tag is-info ${size}`
              }
              data-tip={balanceTooltip}
            >
              {lockedBalance > 0 ? (
                <i className="fa fa-lock" />
              ) : (
                <i className="fa fa-unlock" />
              )}
              &nbsp;
              {atomicToHuman(unlockedBalance + lockedBalance, true)}
              &nbsp;{Configure.ticker}
            </span>
          )}
          {displayCurrency === 'fiat' && symbolLocation === 'prefix' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-warning ${size}`
                  : `tag is-info ${size}`
              }
              data-tip={balanceTooltip}
            >
              {lockedBalance > 0 ? (
                <i className="fa fa-lock" />
              ) : (
                <i className="fa fa-unlock" />
              )}
              &nbsp;
              {fiatPrice !== 0 ? (
                // eslint-disable-next-line prefer-template
                fiatSymbol +
                formatLikeCurrency(
                  Number(
                    (
                      fiatPrice *
                      atomicToHuman(unlockedBalance + lockedBalance, false)
                    ).toFixed(fiatDecimals)
                  )
                )
              ) : (
                <ReactLoading
                  type="bubbles"
                  color="#F5F5F5"
                  height={30}
                  width={30}
                />
              )}
            </span>
          )}
          {displayCurrency === 'fiat' && symbolLocation === 'suffix' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-warning ${size}`
                  : `tag is-info ${size}`
              }
              data-tip={balanceTooltip}
            >
              {lockedBalance > 0 ? (
                <i className="fa fa-lock" />
              ) : (
                <i className="fa fa-unlock" />
              )}
              &nbsp;
              {fiatPrice !== 0 ? (
                // eslint-disable-next-line prefer-template
                formatLikeCurrency(
                  Number(
                    (
                      fiatPrice *
                      atomicToHuman(unlockedBalance + lockedBalance, false)
                    ).toFixed(fiatDecimals)
                  )
                ) + fiatSymbol
              ) : (
                <ReactLoading
                  type="bubbles"
                  color="#F5F5F5"
                  height={30}
                  width={30}
                />
              )}
            </span>
          )}
        </div>
      </div>
    );
  }
}
