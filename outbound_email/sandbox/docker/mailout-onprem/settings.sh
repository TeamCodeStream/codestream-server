
# dockerImageName=""  # default uses directory name as image name
# dockerBuildDirectory=""
[ -z "$CS_OUTBOUND_EMAIL_TOP" ] && pkgJsonDir="." || pkgJsonDir=$CS_OUTBOUND_EMAIL_TOP
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $pkgJsonDir/package.json -p version`
buildParameters=""
runParameters=""
containerName="csmailout"
