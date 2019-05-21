import _ from 'lodash'

export default {
  
  getObjectKey(object, key) {
    return _.get(object, key, '');
  }
}
