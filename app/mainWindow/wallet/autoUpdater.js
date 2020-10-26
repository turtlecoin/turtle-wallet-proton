// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import request from 'request-promise';
import log from 'electron-log';
import semver from 'semver';
import os from 'os';
import { eventEmitter } from '../index';
import npmPackage from '../../../package.json';

const currentVersion = npmPackage.version;
const operatingSystem = os.platform();
const arch = os.arch();

export default class AutoUpdater {
  getLatestVersion() {
    if (process.env.NODE_ENV !== 'development') {
      log.debug('Checking for updates...');
      const options = {
        method: 'GET',
        url: `https://api.getproton.org/latest/${operatingSystem}/${currentVersion}/${arch}`,
        json: true
      };
      request(options, (error, response, body) => {
        if (error) {
          log.debug('Error when contacting update server...');
          return;
        }
        log.info(body);
        if (semver.gt(body.latestVersion, npmPackage.version)) {
          log.debug(
            `Update required! Local version: ${npmPackage.version}, latest version: ${body.latestVersion}`
          );
          const updateFile = body.downloadPath;
          eventEmitter.emit('updateRequired', updateFile);
        } else {
          log.debug('No update found.');
        }
        return body;
      });
    } else {
      log.debug('Development environment detected.');
    }
  }
}
