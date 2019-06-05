param (
    [Parameter(Mandatory=$true)][string]$app_source_code_dir,
    [Parameter(Mandatory=$true)][string]$zip_file_name
 )
  
$dir_to_exclude=@(".vscode")

Get-ChildItem $app_source_code_dir | where { $_.Name -notin $dir_to_exclude} | Compress-Archive -DestinationPath $zip_file_name -Update