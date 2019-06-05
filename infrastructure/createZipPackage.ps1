
param (
    [Parameter(Mandatory=$true)][string]$app_source_code_dir,
    [Parameter(Mandatory=$true)][string]$zip_file_name
 )
 
  Write-Host $app_source_code_dir
  Write-Host $zip_file_name
 

#$YourDirToCompress="C:\Users\ErikOlsen\Documents\_github\repos\ivl\iv_fota_server\admin_api"
#$ZipFileResult="C:\_tmp\functionapp.zip"
$dir_to_exclude=@(".vscode")

Get-ChildItem $app_source_code_dir | where { $_.Name -notin $dir_to_exclude} | Compress-Archive -DestinationPath $zip_file_name -Update