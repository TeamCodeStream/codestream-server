#!/bin/bash

cd $CS_API_TOP/sandbox/docker

# Setup gateway to host machine at 192.168.0.1
#docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 csdevnet

if [ ! -f runtime.env ]; then
	TUNNEL_IP=`netstat -rn|grep '^10\.99'|grep -v '/'|awk '{print $1}'`
	[ -z "$TUNNEL_IP" ] && echo "cannot determine your VPN IP (" && exit 1

	if [ -z "$AWS_ACCESS_KEY_ID" -o -z "$AWS_SECRET_ACCESS_KEY" ]; then
		[ ! -f $HOME/.aws/credentials ] && echo "cannot locate $HOME/.aws/credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables." && exit 1
		export AWS_ACCESS_KEY_ID=`grep -i aws_access_key_id ~/.aws/credentials |head -1|cut -f2 -d=|awk '{print $1}'`
		export AWS_SECRET_ACCESS_KEY=`grep -i aws_secret_access_key ~/.aws/credentials |head -1|cut -f2 -d=|awk '{print $1}'`
	fi
	[ -z "$AWS_ACCESS_KEY_ID" -o -z "$AWS_SECRET_ACCESS_KEY" ] && echo "could not set aws credentials" && exit 1
	[ -z "$DT_USER" ] && echo "DT_USER not set" && exit 1

	create-file-from-template.py -t runtime.env.template -o runtime.env || exit 1
	echo "CS_API_MONGO_HOST=$TUNNEL_IP" >>runtime.env

	echo "runtime.env created."
else
	echo "Using pre-existing runtime.env"
fi

set -x
docker-compose run --rm -p 12079:12079 api bin/cs_api-start-docker
