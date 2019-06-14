# Azure function app package update steps

Note: The initial infrastructure deployment (Terraform) does the initial package upload. Once the infrastructure is deployed, use this script to upload any future Azure function app package changes to Azure. 

## Build the npm packages
- change directory to '.\iv_fota_server\admin_api'
- run `npm install`
- change directory to '.\iv_fota_server\device_api'
- run `npm install`
- run the script
- `.\uploadAzureFunctionAppPackages.ps1 {resource group name} {storage account name} {admin api function app name} {device api function app name}`
- EXAMPLE: `.\uploadAzureFunctionAppPackages.ps1 rg-ivlfota-dev saivlfotadev fa-ivlfota-admin-api-dev fa-ivlfota-device-api-dev`