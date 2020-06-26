
# dockerImageName=""  # default uses directory name as image name
if [ -z "$CS_BROADCASTER_TOP" ]; then
	pkgJsonDir=api_server
	dockerBuildDirectory=`pwd`
else
	pkgJsonDir=$CS_BROADCASTER_TOP
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameterss="-P -v $localConfigDir:/opt/config"
containerName="csbcast"
