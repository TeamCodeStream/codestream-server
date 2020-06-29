
# dockerImageName=""  # default uses directory name as image name
if [ -n "$CS_BROADCASTER_TOP" ]; then
	# running with the sandbox loaded
	pkgJsonDir=$CS_BROADCASTER_TOP
	dockerBuildDirectory=$CS_BROADCASTER_REPO_ROOT
else
	# when no sandbox is loaded, expect the current directory to be the mono repo root
	pkgJsonDir="`pwd`/broadcaster"
	dockerBuildDirectory=`pwd`
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameterss="-P -v $localConfigDir:/opt/config"
containerName="csbcast"
