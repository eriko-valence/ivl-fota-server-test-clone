terraform {
  required_version = ">= 0.12"
    backend "azurerm" {
    storage_account_name = "ivlterraformstate"
    resource_group_name = "rg-ivlterraform-state"
    container_name       = "tfstate"
    key                  = "ivl.terraform.tfstate"
  }
}

variable "location" {
  default = "westus"
}

variable "base_name" {
  default = "ivlfota"
}

variable "aad_admin_web_ui_app_name" {
}

variable "aad_admin_rest_api_app_name" {
}

variable "aad_device_rest_api_app_name" {
}

variable "aad_tenant_id" {
}

variable "azure_storage_blob_name_prefix_firmware_binaries" {
}

variable "function_app_release_package_name_admin_api" {
}

variable "function_app_release_package_name_device_api" {
}

variable "azure_storage_blob_container_name_function_app_releases" {
}

variable "azure_storage_blob_container_name_firmware_binaries" {
}

variable "function_app_default_node_version" {
}

data "azurerm_subscription" "current" {
}

output "env_azure_subscription_display_name" {
  value = data.azurerm_subscription.current.display_name
}

output "env_azure_function_app_admin_api_zip_path" {
  value = data.archive_file.admin_api_zip.output_path
}

output "env_azure_function_app_device_api_zip_path" {
  value = data.archive_file.device_api_zip.output_path
}

output "env_azure_resource_group_name" {
  value = azurerm_resource_group.rg-infrastructure.name
}

output "env_azure_storage_account_name" {
  value = azurerm_storage_account.sa-infrastructure.name
}

output "env_azure_storage_account_blob_container_name_function_releases" {
  value = azurerm_storage_container.sc-function-releases.name
}

output "env_azure_storage_account_blob_container_name_firmware_binaries" {
  value = azurerm_storage_container.sc-firmware-binaries.name
}

output "env_azure_function_app_service_plan" {
  value = azurerm_app_service_plan.sp-infrastructure.name
}

output "env_azure_application_insights_name" {
  value = azurerm_application_insights.ai-infrastructure.name
}

output "env_azure_function_app_url_admin_api" {
  value = "https://${azurerm_function_app.fa-admin-api.name}.azurewebsites.net"
}

output "env_azure_function_app_url_device_api" {
  value = "https://${azurerm_function_app.fa-device-api.name}.azurewebsites.net"
}

output "env_azure_key_vault_name" {
  value = azurerm_key_vault.kv-infrastructure.name
}

data "archive_file" "admin_api_zip" {
  type        = "zip"
  source_dir  = "..\\admin_api"
  output_path = ".\\functionapp-releases\\${var.function_app_release_package_name_admin_api}"
  excludes    = [".vscode"]
}

data "archive_file" "device_api_zip" {
  type        = "zip"
  source_dir  = "..\\device_api"
  output_path = ".\\functionapp-releases\\${var.function_app_release_package_name_device_api}"
  excludes    = [".vscode"]
}

provider "azurerm" {
}

resource "azurerm_storage_blob" "sb-functionapp-admin-api" {
  name                   = var.function_app_release_package_name_admin_api
  resource_group_name    = azurerm_resource_group.rg-infrastructure.name
  storage_account_name   = azurerm_storage_account.sa-infrastructure.name
  storage_container_name = azurerm_storage_container.sc-function-releases.name
  type                   = "block"
  source                 = data.archive_file.admin_api_zip.output_path
  depends_on             = [data.archive_file.admin_api_zip]
}

resource "azurerm_storage_blob" "sb-functionapp-device-api" {
  name                   = var.function_app_release_package_name_device_api
  resource_group_name    = azurerm_resource_group.rg-infrastructure.name
  storage_account_name   = azurerm_storage_account.sa-infrastructure.name
  storage_container_name = azurerm_storage_container.sc-function-releases.name
  type                   = "block"
  source                 = data.archive_file.device_api_zip.output_path
  depends_on             = [data.archive_file.device_api_zip]
}

resource "azurerm_resource_group" "rg-infrastructure" {
  name     = "rg-${var.base_name}-${lower(terraform.workspace)}"
  location = var.location
}

resource "azurerm_storage_account" "sa-infrastructure" {
  name                     = "sa${var.base_name}${lower(terraform.workspace)}"
  resource_group_name      = azurerm_resource_group.rg-infrastructure.name
  location                 = azurerm_resource_group.rg-infrastructure.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
}

resource "azurerm_app_service_plan" "sp-infrastructure" {
  name                = "sp-${var.base_name}-${lower(terraform.workspace)}"
  resource_group_name = azurerm_resource_group.rg-infrastructure.name
  location            = azurerm_resource_group.rg-infrastructure.location
  kind                = "FunctionApp"
  sku {
    tier = "Standard"
    size = "S1"
  }
}

resource "azurerm_storage_container" "sc-function-releases" {
  name                  = var.azure_storage_blob_container_name_function_app_releases
  resource_group_name   = azurerm_resource_group.rg-infrastructure.name
  storage_account_name  = azurerm_storage_account.sa-infrastructure.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "sc-firmware-binaries" {
  name                  = var.azure_storage_blob_container_name_firmware_binaries
  resource_group_name   = azurerm_resource_group.rg-infrastructure.name
  storage_account_name  = azurerm_storage_account.sa-infrastructure.name
  container_access_type = "private"
}

data "azurerm_storage_account_sas" "sas-infrastructure" {
  connection_string = azurerm_storage_account.sa-infrastructure.primary_connection_string
  https_only        = false
  resource_types {
    service   = false
    container = false
    object    = true
  }
  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }
  start  = "2018-03-21"
  expiry = "2028-03-21"
  permissions {
    read    = true
    write   = false
    delete  = false
    list    = false
    add     = false
    create  = false
    update  = false
    process = false
  }
}

resource "azurerm_application_insights" "ai-infrastructure" {
  name                = "ai-${var.base_name}-${lower(terraform.workspace)}"
  resource_group_name = azurerm_resource_group.rg-infrastructure.name
  location            = azurerm_resource_group.rg-infrastructure.location
  application_type    = "Web"
}

resource "azurerm_function_app" "fa-device-api" {
  name                      = "fa-${var.base_name}-device-api-${lower(terraform.workspace)}"
  version                   = "~2"
  location                  = azurerm_resource_group.rg-infrastructure.location
  resource_group_name       = azurerm_resource_group.rg-infrastructure.name
  app_service_plan_id       = azurerm_app_service_plan.sp-infrastructure.id
  storage_connection_string = azurerm_storage_account.sa-infrastructure.primary_connection_string
  app_settings = {
    HASH                           = data.archive_file.device_api_zip.output_base64sha256
    WEBSITE_RUN_FROM_PACKAGE       = "https://${azurerm_storage_account.sa-infrastructure.name}.blob.core.windows.net/${azurerm_storage_container.sc-function-releases.name}/${azurerm_storage_blob.sb-functionapp-device-api.name}${data.azurerm_storage_account_sas.sas-infrastructure.sas}"
    AzureWebJobsStorage            = azurerm_storage_account.sa-infrastructure.primary_connection_string
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.ai-infrastructure.instrumentation_key
    AzureADClientID                = azuread_application.aadapp-device-api.application_id
    AzureADTenantID                = var.aad_tenant_id
    AzureBlobContainer             = var.azure_storage_blob_container_name_firmware_binaries
    AzureBlobNamePrefix            = var.azure_storage_blob_name_prefix_firmware_binaries
    AzureBlobEndpoint              = azurerm_storage_account.sa-infrastructure.primary_blob_endpoint
    AzureBlobStorageDevice         = azurerm_storage_account.sa-infrastructure.primary_connection_string
    AzureKeyVaultName              = azurerm_key_vault.kv-infrastructure.name
    AzureFunctionAppHostName       = "ivlapidevice-${lower(terraform.workspace)}.azurewebsites.net"
    WEBSITE_NODE_DEFAULT_VERSION   = var.function_app_default_node_version
  }
  site_config {
    linux_fx_version = "NODE:${var.function_app_default_node_version}"
    always_on        = "true"
  }
}

resource "azurerm_function_app" "fa-admin-api" {
  name                      = "fa-${var.base_name}-admin-api-${lower(terraform.workspace)}"
  version                   = "~2"
  location                  = azurerm_resource_group.rg-infrastructure.location
  resource_group_name       = azurerm_resource_group.rg-infrastructure.name
  app_service_plan_id       = azurerm_app_service_plan.sp-infrastructure.id
  storage_connection_string = azurerm_storage_account.sa-infrastructure.primary_connection_string
  app_settings = {
    HASH                           = data.archive_file.admin_api_zip.output_base64sha256
    WEBSITE_RUN_FROM_PACKAGE       = "https://${azurerm_storage_account.sa-infrastructure.name}.blob.core.windows.net/${azurerm_storage_container.sc-function-releases.name}/${azurerm_storage_blob.sb-functionapp-admin-api.name}${data.azurerm_storage_account_sas.sas-infrastructure.sas}"
    AzureWebJobsStorage            = azurerm_storage_account.sa-infrastructure.primary_connection_string
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.ai-infrastructure.instrumentation_key
    AzureADClientID                = azuread_application.aadapp-admin-api.application_id
    AzureADTenantID                = var.aad_tenant_id
    AzureBlobContainer             = var.azure_storage_blob_container_name_firmware_binaries
    AzureBlobNamePrefix            = var.azure_storage_blob_name_prefix_firmware_binaries
    AzureBlobEndpoint              = azurerm_storage_account.sa-infrastructure.primary_blob_endpoint
    AzureBlobStorageDevice         = azurerm_storage_account.sa-infrastructure.primary_connection_string
    AzureKeyVaultName              = azurerm_key_vault.kv-infrastructure.name
    AzureFunctionAppHostName       = "fa-${var.base_name}-admin-api-${lower(terraform.workspace)}.azurewebsites.net"
    WEBSITE_NODE_DEFAULT_VERSION   = var.function_app_default_node_version
  }
  site_config {
    linux_fx_version = "NODE:${var.function_app_default_node_version}"
    always_on        = "true"
  }
}

resource "azurerm_key_vault" "kv-infrastructure" {
  name                        = "kv-${var.base_name}-${lower(terraform.workspace)}"
  location                    = azurerm_resource_group.rg-infrastructure.location
  resource_group_name         = azurerm_resource_group.rg-infrastructure.name
  enabled_for_disk_encryption = true
  tenant_id                   = var.aad_tenant_id

  sku {
    name = "standard"
  }

  tags = {
    environment = lower(terraform.workspace)
  }
}

resource "azurerm_key_vault_access_policy" "kvap-device-api" {
  key_vault_id = azurerm_key_vault.kv-infrastructure.id

  tenant_id = var.aad_tenant_id
  object_id = azuread_service_principal.aadsp-device-api.id

  key_permissions = [
    "get",
  ]

  secret_permissions = [
    "get",
  ]
}

resource "azurerm_key_vault_access_policy" "kvap-admin-api" {
  key_vault_id = azurerm_key_vault.kv-infrastructure.id

  tenant_id = var.aad_tenant_id
  object_id = azuread_service_principal.aadsp-admin-api.id

  key_permissions = [
    "get",
  ]

  secret_permissions = [
    "get",
  ]
}

# Configure the Microsoft Azure Active Directory Provider
provider "azuread" {
  version = "~>0.3"
}

# Create an application
resource "azuread_application" "aadapp-admin-web-ui" {
  name                       = "${var.aad_admin_web_ui_app_name}_${upper(terraform.workspace)}"
  reply_urls                 = ["http://localhost:8080"]
  available_to_other_tenants = false
  oauth2_allow_implicit_flow = true
}

# Create an application
resource "azuread_application" "aadapp-admin-api" {
  name            = "${var.aad_admin_rest_api_app_name}_${upper(terraform.workspace)}"
  identifier_uris = ["https://fa-${var.base_name}-admin-api-${lower(terraform.workspace)}.azurewebsites.net"]
}

# Create an application
resource "azuread_application" "aadapp-device-api" {
  name = "${var.aad_device_rest_api_app_name}_${upper(terraform.workspace)}"
}

# Create a service principal
resource "azuread_service_principal" "aadsp-admin-api" {
  application_id = azuread_application.aadapp-admin-api.application_id
}

# Create a service principal
resource "azuread_service_principal" "aadsp-device-api" {
  application_id = azuread_application.aadapp-device-api.application_id
}

