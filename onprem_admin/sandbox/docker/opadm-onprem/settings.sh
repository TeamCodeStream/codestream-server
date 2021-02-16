
# dockerImageName=""  # default uses directory name as image name
if [ -n "$OPADM_TOP" ]; then
	# running with the sandbox loaded
	pkgJsonDir=$OPADM_TOP
	dockerBuildDirectory=$OPADM_REPO_ROOT
else
	# when no sandbox is loaded, expect the current directory to be the mono repo root
	pkgJsonDir="`pwd`/onprem_admin"
	dockerBuildDirectory=`pwd`
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csadmin"
