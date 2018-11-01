#!/bin/bash

function usage {
	echo "usage: $0 [-V docker-version]"
	exit 1
}

dockerVer=""
dockerImage=teamcodestream/local-api
dockerDir=sandbox/docker
edir=$dockerDir/extras

while getopts "V:" arg
do
	case $arg in
	V) dockerVer=":$OPTARG";;
	*) usage
	esac
done

dt-docker-util -a rmi --image-name $dockerImage$dockerVer || exit 1

cd $CS_API_TOP
npm run veryclean
[ ! -d $edir ] && mkdir $edir
cp $CS_API_SSL_KEYFILE $CS_API_SSL_CERTFILE $CS_API_SSL_CAFILE $edir

cat <<EOF >$edir/buildvars.env
ENV AWS_DEFAULT_REGION=us-east-1
ENV CS_API_SSL_CAFILE=/opt/api/api_server/sandbox/docker/extras/wildcard.codestream.us-ca
ENV CS_API_SSL_CERTFILE=/opt/api/api_server/sandbox/docker/extras/wildcard.codestream.us-crt
ENV CS_API_SSL_KEYFILE=/opt/api/api_server/sandbox/docker/extras/wildcard.codestream.us-key
ENV CS_API_MONGO_HOST=mongo
EOF

(for i in `cs_api-vars | egrep -v -e '^(CS_API_MONGO_HOST|CS_API_SUPPRESS_EMAILS|CS_API_SSL_CAFILE|CS_API_SSL_CERTFILE|CS_API_SSL_KEYFILE)='| sed -e "s|$CS_API_SANDBOX|/opt/api|g"`; do echo ENV $i; done) >>$edir/buildvars.env

create-file-from-template.py -o $dockerDir/Dockerfile -t $dockerDir/Dockerfile.template || exit 1

docker build -t $dockerImage$dockerVer -f $dockerDir/Dockerfile .
