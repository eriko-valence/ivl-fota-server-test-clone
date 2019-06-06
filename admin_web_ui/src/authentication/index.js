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
    console.log('authentication.js -> START');


    this.authenticationContext = new AuthenticationContext(config);

    return new Promise((resolve) => {
      console.log('authentication.js -> Promise() -> START');
      //Checks if the URL fragment contains access token, id token or error_description
      if (this.authenticationContext.isCallback(window.location.hash) || window.self !== window.top) {
        console.log('window.location.hash');
        console.log('------------------------');
        console.log(window.location.hash);
        console.log('window.self');
        console.log('------------------------');
        console.log(window.self);
        console.log('window.top');
        console.log('------------------------');
        console.log(window.top);
        console.log('------------------------');
        console.log('authentication.js -> Promise() -> call this.authenticationContext.handleWindowCallback()');
        // redirect to the location specified in the url params.
        /*
           This method must be called for processing the response received from AAD. 
           It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
        */
        this.authenticationContext.handleWindowCallback();
      } else {
        console.log('authentication.js -> Promise() -> try to pull user out of local storage');
        // try pull the user out of local storage
        let user = this.authenticationContext.getCachedUser();

        if (user) {
          console.log('authentication.js -> Promise() -> cached user found');
          console.log(user);
            this.acquireToken().then(() => { 
              console.log('authentication.js -> Promise() -> cached user found -> token acquired -> resolve()');
                resolve(); //successful authentication & authorization
            }).catch((error) => {
              console.log(error);
              console.log('authentication.js -> Promise() -> cached user found -> unable to acquire token -> initiate force sign out process');
              this.signOut();
            }
            )
        } else {
          // no user at all - go sign in.
          console.log('authentication.js -> cached user NOT found -> initiate sign in process ');
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
    console.log('getAccessToken() => checking if token is expired...');
    if (this.authenticationContext.getCachedToken(config.resourceApi)) {
      console.log('getAccessToken() => token is still valid...return it to requester');
      resolve(this.authenticationContext.getCachedToken(config.resourceApi)); 
    } else {
      console.log('getAccessToken() => token is expired... try acquiring a new one');
      this.acquireToken().then((token) => {
        console.log('getAccessToken() => new token acquired...return it to requester');
        resolve(token);
      }).catch((error) => {
        console.log('getAccessToken() => failed to acquire a new token');
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
