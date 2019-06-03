# Deploy the website to Azure

## Validate azure storage static website hosting is enabled
  - Option #1: Azure Portal
    - Navigate to the azure storage account
    - Scroll down to 'Static website'
  - Option #2: Microsoft Azure Storage Explorer
    - Install Microsoft Azure Storage Explorer
    - Navigate to the azure storage account
    - Look for a container called '$web'
      - Note: This container is auto created when static website hosting is enabled
## Compile and minify application code for production
  - Open a command line prompt
  - Navigate to the root of your application code
    - Example: iv_fota_server\management_web_app_client_side
  - Run the following command:
    ```
    npm run build
    ```
    - Note: This will create a 'dist' directory
## Deploy code to azure storage static website
### Option #1: Visual Studio Code
- Install Azure Storage extension (if not already installed)
- Open your application code in VS Code
  - Example: iv_fota_server\management_web_app_client_side
- Right-click on your dist directory and select Deploy to Static Website....
  - Example: iv_fota_server\management_web_app_client_side\dist
### Option #2: Azure CLI
- Install the Azure CLI
- Open a command line prompt
- Navigate to the dist directory of your application code
  - Example: iv_fota_server\management_web_app_client_side\dist
- Upload the code. For example:  
  ```
  blob upload-batch --account-name ivladmindevelopment --account-key qjkObAyFda2d1+NWbgQdeFrxJeHALxucU3oBvg3rihq== --destination '$web' --source ./
  ```