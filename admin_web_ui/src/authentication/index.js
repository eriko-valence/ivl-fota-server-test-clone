import AuthenticationContext from 'adal-angular/lib/adal.js'
import shared from '../shared'
import _ from 'lodash'

const config = {
  tenant: process.env.VUE_APP_AAD_TENANT || '',
  clientId: process.env.VUE_APP_AAD_CLIENT || '',
  redirectUri: process.env.VUE_APP_AAD_REDIRECT_URI || '',
  cacheLocation: process.env.VUE_APP_CACHE_LOCATION || '',
  resourceApi: process.env.VUE_APP_API_ENDPOINT_URL || ''
};

export default {
  authenticationContext: null,
  /**
   * @return {Promise}
   */
  initialize() {
    console.log('#####################################################>authentication.initialize()');
    this.authenticationContext = new AuthenticationContext(config);
    return new Promise((resolve) => {
      //Checks if the URL fragment contains access token, id token or error_description
      if (this.authenticationContext.isCallback(window.location.hash) || window.self !== window.top) {
        console.log('#####################################################>authentication.initialize() => token/error found in URL fragment');
        
        let hash = _.get(window, 'location.hash', '');
        var re = /AADSTS50105/i; 
        console.log('hash:');
        console.log('----------------------------------------------------');
        console.log(hash);
        console.log('-----------------------------------------------------');
        if ( re.test(hash) ) {
          console.log(this.authenticationContext._getItem('adal.state.login'));
          console.log(this.authenticationContext._getItem('adal.error'));
          console.log(this.authenticationContext._getItem('adal.login'));
          console.log(this.authenticationContext._getItem('adal'));
          console.log(this.authenticationContext.getLoginError());
          console.log('Unauthorized!!');
          //window.location.href = 'https://localhost:8080/unauthorized';
          resolve(); //successful authentication & authorization
        }
        
        // redirect to the location specified in the url params.
        /*
           This method must be called for processing the response received from AAD. 
           It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
        */
        this.authenticationContext.handleWindowCallback();
      } else {
        // try pull the user out of local storage
        let user = this.authenticationContext.getCachedUser();

        if (user) {
          console.log('#####################################################>authentication.initialize() => no token/error found in URL fragment => user found');
            this.acquireToken().then(() => { 
                resolve(); //successful authentication & authorization
            }).catch((error) => {
              shared.trackException(error, 'authentication.initialize.acquiretoken.error');
              console.log(error);
              console.log('authentication.initialize.acquiretoken.error... calling signIn()');
              //this.signIn(); //AADSTS50105 - maybe catch?
              resolve(); //successful authentication & authorization
            }
            )
        } else {
          // no user at all - go sign in.
          console.log('#####################################################>authentication.initialize() => no token/error found in URL fragment => NO user found');
          //this.signIn();
          resolve(); //successful authentication & authorization
        }
      }
    });

  },
  /**
   * @return {Promise.<String>} A promise that resolves to an ADAL token for resource access
   */
  acquireToken(){
    console.log('acquireToken');
    return new Promise((resolve, reject) => {
      this.authenticationContext.acquireToken(config.resourceApi, (error, token) => {
        if (error || !token) {
          return reject(error);
        } else {
          return resolve(token);
        }
      });
    });
  },
  /**
   * Issue an interactive authentication request for the current user and the api resource.
   */
  acquireTokenRedirect() {
    console.log('acquireTokenRedirect');
    this.authenticationContext.acquireTokenRedirect(config.resourceApi);
  },
  /**
   * @return {Boolean} Indicates if there is a valid, non-expired access token present in localStorage.
   */
  isAuthenticated() {
    // getCachedToken will only return a valid, non-expired token.
    console.log('isAuthenticated');
    if (this.authenticationContext.getCachedToken(config.resourceApi)) { return true; }
    console.log('isAuthenticated - FALSE');
    return false;
  },
  isAdalError() {
    console.log('isAdalError');
    let loginError = this.authenticationContext.getLoginError();
    var re = /AADSTS50105/i; 
    if ( re.test(loginError) ) {
      return true;
    } else {
      return false;
    }


  },
  getAccessToken() {
    console.log('getAccessToken');
    return new Promise((resolve, reject) => {
    // getCachedToken will only return a valid, non-expired token.
    if (this.authenticationContext.getCachedToken(config.resourceApi)) {
      resolve(this.authenticationContext.getCachedToken(config.resourceApi)); 
    } else {
      this.acquireToken().then((token) => {
        resolve(token);
      }).catch((error) => {
        shared.trackException(error, 'authentication.getaccesstoken.acquiretoken.error');
        reject(error);
      });
    }
  });
  },
  /**
   * @return An ADAL user profile object.
   */
  getUserProfile() {
    console.log('getUserProfile');
    return this.authenticationContext.getCachedUser().profile;
  },
  signIn() {
    console.log('signIn()');
    this.authenticationContext.login();
  },
  signOut() {
    console.log('signOut()');
    this.authenticationContext.logOut();
  }
}
