param (
    [Parameter(Mandatory=$true)][string]$azure_resource_group_name,
    [Parameter(Mandatory=$true)][string]$azure_storage_account_name,
    [Parameter(Mandatory=$true)][string]$azure_function_admin_api_name,
    [Parameter(Mandatory=$true)][string]$azure_function_device_api_name
 )

# sas uri expiration
$sas_expiration = "2030-05-31"

# files/folders to exclude from package files
$dir_to_exclude=@(".vscode")

# package zip azure storage container name
$function_release_container = "function-releases";

# source code directories
$source_code_dir_admin_api  = "..\admin_api";
$source_code_dir_device_api = "..\device_api";

# package zip file names
$package_file_name_admin_api = "functionapp-admin-api.zip";
$package_file_name_device_api = "functionapp-device-api.zip";

# package zip directory
$package_zip_directory = "..\infrastructure\functionapp-releases\";

# package zip file paths
$package_zip_file_path_admin_api = "$($package_zip_directory)\$($package_file_name_admin_api)"
$package_zip_file_path_device_api = "$($package_zip_directory)\$($package_file_name_device_api)"

# create package zip files
Get-ChildItem $source_code_dir_admin_api | where { $_.Name -notin $dir_to_exclude} | Compress-Archive -DestinationPath $package_zip_file_path_admin_api -Update
Get-ChildItem $source_code_dir_device_api | where { $_.Name -notin $dir_to_exclude} | Compress-Archive -DestinationPath $package_zip_file_path_device_api -Update

# upload package zip files to azure storage
az storage blob upload --account-name $azure_storage_account_name -f $package_zip_file_path_admin_api -c $function_release_container -n $package_file_name_admin_api 2> $null
az storage blob upload --account-name $azure_storage_account_name -f $package_zip_file_path_device_api -c $function_release_container -n $package_file_name_device_api 2> $null

# generate azure storage blob sas uri
$blob_sas_full_uri_admin_api = $(az storage blob generate-sas --account-name $azure_storage_account_name --container-name $function_release_container --name $package_file_name_admin_api --permissions r --expiry $sas_expiration --full-uri)
$blob_sas_full_uri_device_api = $(az storage blob generate-sas --account-name $azure_storage_account_name --container-name $function_release_container --name $package_file_name_device_api --permissions r --expiry $sas_expiration --full-uri)

# update the app settings
az functionapp config appsettings set --name $azure_function_admin_api_name --resource-group $azure_resource_group_name --settings "WEBSITE_RUN_FROM_PACKAGE=$blob_sas_full_uri_admin_api"
az functionapp config appsettings set --name $azure_function_device_api_name --resource-group $azure_resource_group_name --settings "WEBSITE_RUN_FROM_PACKAGE=$blob_sas_full_uri_device_api"

# restart the function apps
az functionapp restart --name $azure_function_admin_api_name --resource-group $azure_resource_group_name
az functionapp restart --name $azure_function_device_api_name --resource-group $azure_resource_group_name