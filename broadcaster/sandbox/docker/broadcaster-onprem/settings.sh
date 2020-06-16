
# dockerImageName=""  # default uses directory name as image name
# dockerBuildDirectory=""
[ -z "$CS_BROADCASTER_TOP" ] && pkgJsonDir="." || pkgJsonDir=$CS_BROADCASTER_TOP
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameterss="-P -v $localConfigDir:/opt/config"
containerName="csbcast"
