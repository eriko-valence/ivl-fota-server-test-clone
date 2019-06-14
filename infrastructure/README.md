# Deploy the website to Azure

## Install Terraform & Azure CLI
NOTE: Only needs to be done once on local deployment system
- Install Azure CLI
- Install Terraform
- Install node
- Clone repo

## Install package dependencies
- In repo directory, navigate to 'admin_api' directory
- Run 'npm install'

## Manually create Azure storage account for storing Terraform state
NOTE: This only needs to be done once per Azure subscription
- Create a new Azure resource group (e.g., rg-ivlterraform-state)
- Create a new Azure storage account (e.g., ivlterraformstate)
- Create a new Azure sotrage account blob container (e.g., tfstate)

## Update Terraform deployment script with these Azure storage account values (from last step)
NOTE: Only required if new resources were set up from above step
- Example:
```
terraform {
  required_version       = ">= 0.12"
    backend "azurerm" {
    storage_account_name = "ivlterraformstate"  <-- UPDATE
    resource_group_name  = "rg-ivlterraform-state" <-- UPDATE
    container_name       = "tfstate" <-- UPDATE
    key                  = "ivl.terraform.tfstate" <-- OPTIONALLY UPDATE
  }
}
```

## Setup Terraform environment
- Login using the azure command line tool
```
az login
az account list --output table
az account set --subscription "IVL Development"
```
## Example variable values used by README.md
```
aad_admin_web_ui_app_name = "IVL_FOTA_Admin_Web_UI"
aad_admin_rest_api_app_name = "IVL_FOTA_Admin_API"
aad_device_rest_api_app_name = "IVL_FOTA_Device_API"
```

## Prepare Terraform variables (set in terraform.tfvars file)
- The following values can be customized based on preference:
```
base_name = "ivlfota"
aad_admin_web_ui_app_name = "IVL_FOTA_Admin_Web_UI"
aad_admin_rest_api_app_name = "IVL_FOTA_Admin_API"
aad_device_rest_api_app_name = "IVL_FOTA_Device_API"
```
- The following values should be set according to your environment requirements:
```
aad_tenant_id = "{tenantid}"
location = "westus"
```
- The following values can be left as is: 
```
function_app_default_node_version = "10.14.1"
function_app_release_package_name_admin_api = "functionapp-admin-api.zip"
function_app_release_package_name_device_api = "functionapp-device-api.zip"
azure_storage_blob_container_name_function_app_releases = "function-releases"
azure_storage_blob_container_name_firmware_binaries = "fota"
azure_storage_blob_name_prefix_firmware_binaries = "bin/"
```

## Initialize Terraform
This will set up the Terraform state to be resident on Azure and initialize providers.
```
terraform init
```

## Setup Terraform workspace
- Create a new workspace if you don't yet have one for the environment (e.g., dev) you will be deploying. For example: 
```
terraform workspace new dev
```
- Switch to the existing workspace if you already have one for your environment to be deployed. For example:
```
terraform workspace switch dev
```
- Confirm you are now using the correct workspace
```
terraform workspace list
```

## Deploy Azure infrastructure using Terraform
```
terraform apply -var-file="terraform.tfvars"
```

## Manually Configure Azure infrastructure
- Set values for the following secrets (Azure Key Vault):
```
'AzureBlobStorageConnectionString'
'AzureSqlServerLoginName'
'AzureSqlServerLoginPass'
'AzureSqlDatabaseName'
'AzureSqlServerName'
```
- Set Function App Azure Key Vault credentials (Azure )
	- Admin API
		- Open Azure Active Directory in the azure portal
		- Navigate to 'App Registration'
		- Select the AD App representing the admin API (e.g., IVL_FOTA_Admin_API_DEV)
		- Select 'Certificates & secrets'
		- Select '+New client secret' button
		- Type in a description (e.g, "azure_key_vault")
		- Set Expires to 'Never'
		- Select 'Add'
		- Copy the secret value (you won't be able to retrieve it after exiting this pane)
		- Open the admin function app in the azure portal (e.g., fa-ivlfota-admin-api-dev)
		- Navigate to Platform Features and select 'Configuration' from the Overview tabe
		- Create the setting 'AzureADClientSecret' and add the secret as its value
	- Device API
		- Open Azure Active Directory in the azure portal
		- Navigate to 'App Registration'
		- Select the AD App representing the device API (e.g., IVL_FOTA_Device_API_DEV)
		- Select 'Certificates & secrets'
		- Select '+New client secret' button
		- Type in a description (e.g, "azure_key_vault")
		- Set Expires to 'Never'
		- Select 'Add'
		- Copy the secret value (you won't be able to retrieve it after exiting this pane)
		- Open the device function app in the azure portal (e.g., fa-ivlfota-device-api-dev)
		- Navigate to Platform Features and select 'Configuration' from the Overview tabe
		- Create the setting 'AzureADClientSecret' and add the secret as its value
- Enable static website hosting (Azure Storage)
	- Note: Terraform does not currently support Azure storage static website hosting configuration
		- https://github.com/terraform-providers/terraform-provider-azurerm/issues/1903
	- Note: Azure storage static website configuration is supported using the Blob Service REST API
		- https://docs.microsoft.com/en-us/rest/api/storageservices/set-blob-service-properties#request
	- Open the azure storage account in the azure portal (e.g., saivlfotadev)
	- Select 'static website' and set static website to 'Enabled'
	- Add 'index.html' to to index and error document paths
	- Click 'Save'
	- Note: The primary endpoint will be the URL to the admin web ui (e.g., https://saivlfotadev.z22.web.core.windows.net)
- Enable CORS (Azure Storage)
	- Open the azure storage account in the azure portal (e.g., saivlfotadev)
	- Select 'CORS' and configure as follows:
		- Allowed origins: This is the URL to the admin web ui (e.g., https://saivlfotadev.z22.web.core.windows.net)
		- Allowed Methods: PUT
		- Allowed Headers: *
		- Exposed Header: *
		- Max Age: 0
- Deploy admin web ui to azure blob static website
	- Update the following variables in 'iv_fota_server\admin_web_ui\\.env.production': 
		- VUE_APP_API_ENDPOINT_URL (i.e., admin api function app url)
		- VUE_APP_AAD_CLIENT (i.e., aad web ui app id - e.g., app id for 'IVL_FOTA_Admin_Web_UI_DEV')
		- VUE_APP_AAD_REDIRECT_URI (i.e., admin web ui url)
	- Change the directory to 'iv_fota_server\admin_web_ui' and run the command `npm run build`
	- Upload all contents in 'iv_fota_server\admin_web_ui\dist' to azure storage blob container $web
		- Change to the directory 'iv_fota_server\admin_web_ui\dist'
		- Run this command: `az storage blob upload-batch --account-name {storage_acct_name} --destination '$web' --source ./`
- Enable AAD auth on admin function app (Function App)
	- Note: Terraform does not currently support Function app AAD auth configuration 
		- https://github.com/terraform-providers/terraform-provider-azurerm/issues/1992
	- Open the admin function app in the azure portal (e.g., fa-ivlfota-admin-api-dev)
	- Navigate to Platform Features and select Authentication/Authorization
	- Set 'App Services Authentication' to On
	- Select 'Log in with Azure Active Dircectory'
	- Select 'Azure Active Directory' under Authentication Providers
	- Select the 'Express' management mode
	- Select 'Select Existing AD App' 
	- Select 'Azure AD App' 
	- Search the associated AD App (e.g., IVL_FOTA_Admin_API_DEV)
	- Click OK after selecting this AD App
	- Click 'Save'
	- Select 'Azure Active Directory Configured (Express : Existing App)' under Authentication Providers
	- Click 'Advanced'
	- Add the admin api function app URL to the 'Allowed Tokens Audience' list
		- Example: https://fa-ivlfota-admin-api-dev.azurewebsites.net
	- Click 'OK'
	- Click 'Save'
- Configure CORS on admin function app (Function App)
	- Open the admin api function app in the azure portal (e.g., fa-ivlfota-admin-api-dev)
	- Navigate to Platform Features and select 'CORS'
	- Add the admin web ui primary endpoint (e.g., https://saivlfotadev.z22.web.core.windows.net)
	- Click 'Save'
- Configure admin web ui AAD app (Azure Active Directory)
	- Open Azure Active Directory in the azure portal
	- Navigate to 'App Registration'
	- Select the AD App representing the admin web ui (e.g., IVL_FOTA_Admin_Web_UI_DEV)
	- Select the 'Redirect URIs' link
	- Add the admin web ui primary endpoint (e.g., https://saivlfotadev.z22.web.core.windows.net/)
	- Click 'Save'
	- Select 'API permissions'
	- Click "+ Add a permission"
	- Select "My APIs"
	- Select admin api function aad app name
		- Example: IVL_FOTA_Admin_API_DEV
	- Select "user_impersonation" and click "Add permissions"
	- Click "+ Add a permission"
	- Select 'Microsoft Graph'
	- Select 'Deleted permissions'
	- Select 'User' -> 'User.Read' and click "Add permissions"
	- Note: These permission should be admin consented. There are two different ways to do this:
		- Option #1: Azure Portal
			- Open Azure Active Directory in the azure portal
			- Navigate to 'App Registration'
			- Select the AD App representing the admin web ui (e.g., IVL_FOTA_Admin_Web_UI_DEV)
			- Select 'API permissions'
			- Under 'Grant consent', select the 'Grant admin consent for {tenant_name}'
		- Option #2: 
			- Build and run the following admin consent URL:
			```
			https://login.microsoftonline.com/{tenant_id}/adminconsent?client_id={client_id}&redirect_uri={admin_web_ui_url}
			```
	- Note: Admin will have to consent (alternatively, users will be prompted to consent the first time they login)
- Enable AAD User Assignment for admin api AAD app (Azure Active Directory)
	- Open Azure Active Directory in the azure portal
	- Navigate to 'Enterprise applications'
	- Select the admin api AAD app (e.g., IVL_FOTA_Admin_API_DEV)
	- Select 'Properties'
	- Set 'User assignment required?' to 'Yes'
	- Click 'Save'
	- Select 'Users and groups'
	- Add your list of authorized admin web ui users here
	- Click 'Save'
- Setup cname record for mf2fota-dev.2to8.cc
- Configure SSL certificate
		
## Destroy Azure infrastructure using Terraform
- Confirm you are now using the correct workspace (e.g., "dev")
```
terraform workspace list
```
- Destroy the environment
```
terraform destroy -var-file="terraform.dev.tfvars"
```
