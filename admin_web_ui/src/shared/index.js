import _ from 'lodash'
import {AppInsights} from 'applicationinsights-js'

/* Call downloadAndSetup to download full ApplicationInsights script from CDN and initialize it with instrumentation key */
AppInsights.downloadAndSetup({ instrumentationKey: process.env.VUE_APP_APPINSIGHTS_INSTRUMENTATIONKEY });

export default {
  getObjectKey(object, key) {
    return _.get(object, key, '');
  },
  isVersionValidFormat(s) {
    let regex = /^[a-zA-Z](\d+)\.(\d+)\.(\d+)-(\d+)-g[0-9a-zA-Z-]+$/
    let matched = regex.exec(s);
    if (matched === null) { return false} else {return true}
  },
  getErrorResponseMessage(error) {
    let msg = _.get(error, 'response.data.error', null);
    if (msg === null) { msg = error}
    return msg;
  },
  trackException(error, source) {
    if (error) {
      AppInsights.trackException(error, 'notused', { 'source': source });
    } else {
      AppInsights.trackException(new Error('unknown error'), 'notused', { 'step': source });
    }
  }
}
