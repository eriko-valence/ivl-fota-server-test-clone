# management_web_app_client_side

## Set Up Local Development Environment

#### Setup GitHub Repo
- Create repo (e.g., iv_fota_server)
- Clone repo down to local machine
- Open command prompt and navigate to local root github repo path

#### Install Node Tools (nvm, npm & npx)
- Download and install nvm
  - nvm-windows: https://github.com/coreybutler/nvm-windows
  - mac-os: https://github.com/creationix/nvm
- Validate nvm is installed
  - ```nvm version```
- Install node.js
  - nvm-windows: ```nvm install v10.15.3```
  - mac-os: ```nvm install v10.15.3```
  - Note: Node.js is only needed for npm
- Select nodejs 8.10.0
  - ```nvm list```
  - ```nvm use 10.15.3```
- Validate node and npm are installed
  - ```node -v``` (e.g., v10.15.3)
  - ```npm -v``` (e.g., 6.4.1)
- Install latest version of node package manager (npm)
  - ```npm install npm@latest -g```
  - Note: Windows users may get the error "Refusing to delete C:\Program Files\nodejs\npm: is outside C:\Program Files\nodejs\npm and not a link. File exists: C:\Program Files\nodejs\npm. Move it away and try again." In this case, try these steps:
    - ```cd "C:\Program Files\nodejs"```
	- ```del npm npm.cmd```
	- ```move node_modules\npm node_modules\npm2```
	- ```node .\node_modules\npm2\bin\npm-cli.js i npm@latest -g```
	- ```rmdir /S /Q node_modules\npm2```

#### Create Vue.js 3.x Project
- Install Vue.js 3.x CLI (if not already installed)
  - ```npm install -g @vue/cli```
- Launch Vue.js 3.x GUI (used to manage Vue.js 3.x projects)
  - `vue ui`
- Select *Vue Project Manager*
- Select *Create*
- Select root project path location
- Select *Create a new project here*
- Enter project name (e.g., management_web_app_client_side)
- Disable *Initialize git repository (github repo already exists in our case)
- Select *Next*
- Select default preset (babel, eslint)
- Select *Create project*
- Navigate to *Plugins*
- Select *Add vue-router*
- Select *Continue* on the *Add router* dialog

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
