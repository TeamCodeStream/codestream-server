
# dockerImageName=""  # default uses directory name as image name
# dockerBuildDirectory=""
dockerHubOrganization=teamcodestream
defaultImageVersion=`get-json-property -j $CS_API_TOP/package.json -p version`
buildParameters=""
runParameters=""
containerName="csapi"
