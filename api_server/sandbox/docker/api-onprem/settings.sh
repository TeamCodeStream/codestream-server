
# dockerImageName=""  # default uses directory name as image name
# dockerBuildDirectory=""
[ -z "$CS_API_TOP" ] && pkgJsonDir="." || pkgJsonDir=$CS_API_TOP
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csapi"
