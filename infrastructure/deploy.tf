provider "azurerm" {
}

variable "env_prefix_lower" {
  default = "dev"
}

variable "env_prefix_upper" {
  default = "DEV"
}

variable "location" {
  default = "westus"
}

variable "base_name" {
  default = "ivlfota"
}

variable "aad_admin_web_ui_app_name" {
  default = ""
}

variable "aad_admin_rest_api_app_name" {
  default = ""
}

variable "aad_device_rest_api_app_name" {
  default = ""
}

variable "aad_tenant_id" {
  default = ""
}

variable "firmware_blob_container_name" {
  default = ""
}

variable "firmware_blob_prefix" {
  default = ""
}

resource "azurerm_resource_group" "rg-infrastructure" {
  name     = "rg-${var.base_name}-${var.env_prefix_lower}"
  location = "${var.location}"
}

resource "azurerm_storage_account" "sa-infrastructure" {
  name                     = "sa${var.base_name}${var.env_prefix_lower}"
  resource_group_name      = "${azurerm_resource_group.rg-infrastructure.name}"
  location                 = "${azurerm_resource_group.rg-infrastructure.location}"
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind = "StorageV2"
}

resource "azurerm_app_service_plan" "sp-infrastructure" {
  name                = "sp-${var.base_name}-${var.env_prefix_lower}"
  resource_group_name = "${azurerm_resource_group.rg-infrastructure.name}"
  location            = "${azurerm_resource_group.rg-infrastructure.location}"
  kind                = "FunctionApp"
  sku {
    tier = "Standard"
    size = "S1"
  }
}

resource "azurerm_storage_container" "sc-function-releases" {
  name                  = "function-releases"
  resource_group_name   = "${azurerm_resource_group.rg-infrastructure.name}"
  storage_account_name  = "${azurerm_storage_account.sa-infrastructure.name}"
  container_access_type = "private"
}

resource "azurerm_storage_blob" "sb-functionapp-admin-api" {
  name = "functionapp-admin-api.zip"
  resource_group_name   = "${azurerm_resource_group.rg-infrastructure.name}"
  storage_account_name  = "${azurerm_storage_account.sa-infrastructure.name}"
  storage_container_name = "${azurerm_storage_container.sc-function-releases.name}"
  type   = "block"
  source = ".\\functionapp-releases\\functionapp-admin-api.zip"
}

resource "azurerm_storage_blob" "sb-functionapp-device-api" {
  name = "functionapp-device-api.zip"
  resource_group_name   = "${azurerm_resource_group.rg-infrastructure.name}"
  storage_account_name  = "${azurerm_storage_account.sa-infrastructure.name}"
  storage_container_name = "${azurerm_storage_container.sc-function-releases.name}"
  type   = "block"
  source = ".\\functionapp-releases\\functionapp-device-api.zip"
}

data "azurerm_storage_account_sas" "sas-infrastructure" {
  connection_string = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
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
  name                = "ai-${var.base_name}-${var.env_prefix_lower}"
  resource_group_name = "${azurerm_resource_group.rg-infrastructure.name}"
  location            = "${azurerm_resource_group.rg-infrastructure.location}"
  application_type    = "Web"
}

resource "azurerm_function_app" "fa-device-api" {
  name                      = "fa-${var.base_name}-device-api-${var.env_prefix_lower}"
  version					= "~2"
  location                  = "${azurerm_resource_group.rg-infrastructure.location}"
  resource_group_name       = "${azurerm_resource_group.rg-infrastructure.name}"
  app_service_plan_id       = "${azurerm_app_service_plan.sp-infrastructure.id}"
  storage_connection_string = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
  app_settings {
    HASH            = "${base64sha256(file(".\\functionapp-releases\\functionapp-device-api.zip"))}"
    WEBSITE_RUN_FROM_PACKAGE = "https://${azurerm_storage_account.sa-infrastructure.name}.blob.core.windows.net/${azurerm_storage_container.sc-function-releases.name}/${azurerm_storage_blob.sb-functionapp-device-api.name}${data.azurerm_storage_account_sas.sas-infrastructure.sas}"
	AzureWebJobsStorage = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
	"APPINSIGHTS_INSTRUMENTATIONKEY" = "${azurerm_application_insights.ai-infrastructure.instrumentation_key}"
	"AzureBlobContainer" = "${var.firmware_blob_container_name}"
	"AzureBlobNamePrefix" = "${var.firmware_blob_prefix}"
	"AzureBlobEndpoint" = "${azurerm_storage_account.sa-infrastructure.primary_blob_endpoint}"
	"AzureBlobStorageDevice" = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
	"AzureKeyVaultName" = "${azurerm_key_vault.kv-infrastructure.name}"
  }
  site_config {
    linux_fx_version = "node:10.14.1"
  }
}

resource "azurerm_function_app" "fa-admin-api" {
  name                      = "fa-${var.base_name}-admin-api-${var.env_prefix_lower}"
  version					= "~2"
  location                  = "${azurerm_resource_group.rg-infrastructure.location}"
  resource_group_name       = "${azurerm_resource_group.rg-infrastructure.name}"
  app_service_plan_id       = "${azurerm_app_service_plan.sp-infrastructure.id}"
  storage_connection_string = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
  app_settings {
    HASH            = "${base64sha256(file(".\\functionapp-releases\\functionapp-admin-api.zip"))}"
    WEBSITE_RUN_FROM_PACKAGE = "https://${azurerm_storage_account.sa-infrastructure.name}.blob.core.windows.net/${azurerm_storage_container.sc-function-releases.name}/${azurerm_storage_blob.sb-functionapp-admin-api.name}${data.azurerm_storage_account_sas.sas-infrastructure.sas}"
	AzureWebJobsStorage = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
	"APPINSIGHTS_INSTRUMENTATIONKEY" = "${azurerm_application_insights.ai-infrastructure.instrumentation_key}"
	"AzureADClientID" = "${azuread_application.aadapp-admin-api.application_id}"
	"AzureADClientSecret" = "MANUALLY_SET"
	"AzureADTenantID" = "${var.aad_tenant_id}"
	"AzureBlobContainer" = "${var.firmware_blob_container_name}"
	"AzureBlobNamePrefix" = "${var.firmware_blob_prefix}"
	"AzureBlobEndpoint" = "${azurerm_storage_account.sa-infrastructure.primary_blob_endpoint}"
	"AzureBlobStorageDevice" = "${azurerm_storage_account.sa-infrastructure.primary_connection_string}"
	"AzureKeyVaultName" = "${azurerm_key_vault.kv-infrastructure.name}"
  }
  site_config {
    linux_fx_version = "node:10.14.1"
  }
}

resource "azurerm_key_vault" "kv-infrastructure" {
  name                        = "kv-${var.base_name}-${var.env_prefix_lower}"
  location                  = "${azurerm_resource_group.rg-infrastructure.location}"
  resource_group_name       = "${azurerm_resource_group.rg-infrastructure.name}"
  enabled_for_disk_encryption = true
  tenant_id                   = "${var.aad_tenant_id}"

  sku {
    name = "standard"
  }
  
  tags = {
    environment = "${var.env_prefix_lower}"
  }
}

resource "azurerm_key_vault_access_policy" "kvap-device-api" {
  key_vault_id          = "${azurerm_key_vault.kv-infrastructure.id}"

  tenant_id = "${var.aad_tenant_id}"
  object_id = "${azuread_application.aadapp-device-api.id}"

  key_permissions = [
    "get",
  ]

  secret_permissions = [
    "get",
  ]
}

resource "azurerm_key_vault_access_policy" "kvap-admin-api" {
  key_vault_id          = "${azurerm_key_vault.kv-infrastructure.id}"

  tenant_id = "${var.aad_tenant_id}"
  object_id = "${azuread_application.aadapp-admin-api.id}"

  key_permissions = [
    "get",
  ]

  secret_permissions = [
    "get",
  ]
}

# Configure the Microsoft Azure Active Directory Provider
provider "azuread" {
  version = "=0.3.0"
}

# Create an application
resource "azuread_application" "aadapp-admin-web-ui" {
  name = "${var.aad_admin_web_ui_app_name}_${var.env_prefix_upper}"
  reply_urls                 = ["http://localhost:8080"]
  available_to_other_tenants = false
  oauth2_allow_implicit_flow = true
}

# Create an application
resource "azuread_application" "aadapp-admin-api" {
  name = "${var.aad_admin_rest_api_app_name}_${var.env_prefix_upper}"
}

# Create an application
resource "azuread_application" "aadapp-device-api" {
  name = "${var.aad_device_rest_api_app_name}_${var.env_prefix_upper}"
}

# Create a service principal
resource "azuread_service_principal" "aadsp-admin-api" {
  application_id = "${azuread_application.aadapp-admin-api.application_id}"
}

# Create a service principal
resource "azuread_service_principal" "aadsp-device-api" {
  application_id = "${azuread_application.aadapp-device-api.application_id}"
}
