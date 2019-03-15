
# This sets up the environment for the TeamCity Docker Build

. $CS_API_TOP/sandbox/defaults.sh

DOCKER_AUTH_FILE=$HOME/.codestream/docker/dockerhub-jimmyjayp
if [ ! -f $DOCKER_AUTH_FILE ]; then
	echo "********************************************************************"
	echo "ERROR: Docker Auth File ($DOCKER_AUTH_FILE) not found"
	echo "********************************************************************"
else
	. $DOCKER_AUTH_FILE
	export DOCKER_USER
	export DOCKER_PASS
fi
