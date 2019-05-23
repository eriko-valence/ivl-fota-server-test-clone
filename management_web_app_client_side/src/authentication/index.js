import AuthenticationContext from 'adal-angular/lib/adal.js'

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

    this.authenticationContext = new AuthenticationContext(config);

    return new Promise((resolve) => {
      if (this.authenticationContext.isCallback(window.location.hash) || window.self !== window.top) {
        // redirect to the location specified in the url params.
        this.authenticationContext.handleWindowCallback();
      } else {
        // try pull the user out of local storage
        let user = this.authenticationContext.getCachedUser();

        if (user) {
            this.acquireToken().then(() => { 
                resolve(); //successful authentication & authorization
            }).catch(() => { 
              this.signOut();
            }
            )
        } else {
          // no user at all - go sign in.
          this.signIn();
        }
      }
    });

  },
  /**
   * @return {Promise.<String>} A promise that resolves to an ADAL token for resource access
   */
  acquireToken() {
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
    this.authenticationContext.acquireTokenRedirect(config.resourceApi);
  },
  /**
   * @return {Boolean} Indicates if there is a valid, non-expired access token present in localStorage.
   */
  isAuthenticated() {
    // getCachedToken will only return a valid, non-expired token.
    if (this.authenticationContext.getCachedToken(config.resourceApi)) { return true; }
    return false;
  },
  getAccessToken() {
    return new Promise((resolve, reject) => {
    // getCachedToken will only return a valid, non-expired token.
    if (this.authenticationContext.getCachedToken(config.resourceApi)) {
      resolve(this.authenticationContext.getCachedToken(config.resourceApi)); 
    } else {
      this.acquireToken().then((token) => {
        resolve(token);
      }).catch((error) => {
        reject(error);
      });
    }
  });
  },
  /**
   * @return An ADAL user profile object.
   */
  getUserProfile() {
    return this.authenticationContext.getCachedUser().profile;
  },
  signIn() {
    this.authenticationContext.login();
  },
  signOut() {
    this.authenticationContext.logOut();
  }
}
