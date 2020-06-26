
# dockerImageName=""  # default uses directory name as image name
if [ -z "$CS_OUTBOUND_EMAIL_TOP" ]; then
	pkgJsonDir=outbound_email
	dockerBuildDirectory=`pwd`
else
	pkgJsonDir=$CS_OUTBOUND_EMAIL_TOP
fi
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csmailout"
