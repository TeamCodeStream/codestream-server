
# dockerImageName=""  # default uses directory name as image name
if [ -n "$CS_OUTBOUND_EMAIL_TOP" ]; then
	# running with the sandbox loaded
	pkgJsonDir=$CS_OUTBOUND_EMAIL_TOP
	dockerBuildDirectory=$CS_OUTBOUND_EMAIL_REPO_ROOT
else
	# when no sandbox is loaded, expect the current directory to be the mono repo root
	pkgJsonDir="`pwd`/api_server"
	dockerBuildDirectory=`pwd`
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csmailout"
