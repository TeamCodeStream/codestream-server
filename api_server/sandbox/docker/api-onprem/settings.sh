
# dockerImageName=""  # default uses directory name as image name
if [ -z "$CS_API_TOP" ]; then
	pkgJsonDir=api_server
	dockerBuildDirectory=`pwd`
else
	pkgJsonDir=$CS_API_TOP
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csapi"
