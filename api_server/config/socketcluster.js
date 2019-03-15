// socketcluster configuration

'use strict';

module.exports = {
	host: process.env.CS_API_SOCKETCLUSTER_HOST,
	port: process.env.CS_API_SOCKETCLUSTER_PORT,
	dontRejectUnauthorized: process.env.CS_API_SOCKETCLUSTER_DONT_REJECT_UNAUTHORIZED,
	authSecret: process.env.CS_API_SOCKETCLUSTER_AUTH_SECRET
};
