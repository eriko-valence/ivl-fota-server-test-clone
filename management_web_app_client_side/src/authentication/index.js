import AuthenticationContext from 'adal-angular/lib/adal.js'

const config = {
  tenant: '255386c0-9741-4725-a48e-b2b1567706d9', //4af490af-c525-448d-b2c1-5a941571567e, 255386c0-9741-4725-a48e-b2b1567706d9 (valence)
  clientId: '79b2b483-4be6-45fe-bb1d-c7a9635cbf6c', //9777657a-54cd-4792-9230-b0d6385e14b2, 79b2b483-4be6-45fe-bb1d-c7a9635cbf6c (valence)
  redirectUri: 'https://ivladmindevelopment.z5.web.core.windows.net/', //http://localhost:8080, https://ivladmindevelopment.z5.web.core.windows.net/
  cacheLocation: 'localStorage', //localStorage, sessionStorage
  resourceApi: 'https://ivlapiadmin.azurewebsites.net' //https://secured-azure-function-app.azurewebsites.net, https://ivlapiadmin.azurewebsites.net
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
