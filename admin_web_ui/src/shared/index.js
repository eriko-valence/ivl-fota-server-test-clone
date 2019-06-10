import _ from 'lodash'

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
  }
}
