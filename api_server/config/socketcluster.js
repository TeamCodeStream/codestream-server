// socketcluster configuration

'use strict';

module.exports = {
	host: process.env.CS_API_MESSAGER_HOST,
	port: process.env.CS_API_MESSAGER_PORT,
	dontRejectUnauthorized: process.env.CS_API_MESSAGER_DONT_REJECT_UNAUTHORIZED
};
