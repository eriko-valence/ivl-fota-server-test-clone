# Deploy the website to Azure

## Create source code package
	- Option #1 (Windows): PowerShell
    ```
	infrastructure> .\createZipPackage.ps1 -app_source_code_dir ../device_api -zip_file_name .\functionapp-releases\functionapp-device-api.zip
	infrastructure> .\createZipPackage.ps1 -app_source_code_dir ../admin_api -zip_file_name .\functionapp-releases\functionapp-admin-api.zip
    ```
## Setup Terraform environment
	- Option #1 (Windows): Set Environment Variables
    ```
    setupTerraformEnv.ps1
    ------------------------------------------------------------
    Set-Item -Path Env:ARM_SUBSCRIPTION_ID -Value ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
    Set-Item -Path Env:ARM_CLIENT_ID -Value ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
    Set-Item -Path Env:ARM_CLIENT_SECRET -Value ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
    Set-Item -Path Env:ARM_TENANT_ID -Value ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
    ```
    - Option #2: Login using  the azure command line tool
    ```
    az login
    az account list --output table
    az account set --subscription "IVL Development"
    ```
## Deploy Azure infrastructure using Terraform
    ```
    terraform init
    terraform apply -var-file="terraform.tfvars"
    ```

## Conigure deployed Azure infrastructure
    - Set values for the following secrets (Azure Key Vault):
		- 'AzureBlobStorageConnectionString'
		- 'AzureSqlServerLoginName'
		- 'AzureSqlServerLoginPass'
		- 'AzureSqlDatabaseName'
		- 'AzureSqlServerName'
	- Enable static website hosting (Azure Storage)
		- Note: Terraform does not currently support Azure storage static website hosting configuration
			- https://github.com/terraform-providers/terraform-provider-azurerm/issues/1903
		- Note: Azure storage static website configuration is supported using the Blob Service REST API
			- https://docs.microsoft.com/en-us/rest/api/storageservices/set-blob-service-properties#request
		- Open the azure storage account in the azure portal (e.g., saivlfotadev)
		- Set static website to 'Enabled'
		- Add 'index.html' to to index and error document paths
		- Click 'Save'
		- Note: The primary endpoint will be the URL to the admin web ui (e.g., https://saivlfotadev.z22.web.core.windows.net/)
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
		- Select 'Azure Active Directory (Configured: Advanced)' under Authentication Providers
		- Add the function app URL to the 'Allowed Tokens Audience' list
			- Example: https://fa-ivlfota-admin-api-dev.azurewebsites.net
		- Click 'Save'
	- Configure CORS on admin function app (Function App)
		- Open the admin function app in the azure portal (e.g., fa-ivlfota-admin-api-dev)
		- Navigate to Platform Features and select 'CORS'
		- Add the admin web ui primary endpoint (e.g., https://saivlfotadev.z22.web.core.windows.net/)
		- Click 'Save'
	- Configure admin web ui AAD app (Azure Active Directory)
		- Open Azure Active Directory in the azure portal
		- Navigate to 'App Registration'
		- Select the AD App representing the admin web ui (e.g., IVL_FOTA_Admin_Web_UI_DEV)
		- Select 'Add a redirect URI'
		- Add the admin web ui primary endpoint (e.g., https://saivlfotadev.z22.web.core.windows.net/)
		- Click 'Save'
		- Select 'API permissions'
		- Click "Add a permission"
		- Select "My APIs"
		- Select the API app name associated (e.g., name of the AAD app that corresponds to your azure function): (e.g., IVL_FOTA_Admin_API_DEV)
		- Select "user_impersonation" and click "Add permissions"
	- Enable AAD User Assignment for admin api AAD app (Azure Active Directory)
		- Open Azure Active Directory in the azure portal
		- Navigate to 'Enterprise applications'
		- Select the admin api AAD app (e.g., IVL_FOTA_Admin_API_DEV)
		- Select 'Properties'
		- Set 'User assignment required?' to 'Enabled'
		- Select 'Users and groups'
		- Add authorized admin web ui users here
		
## Destroy Azure infrastructure using Terraform
    ```
    terraform destroy
    ```