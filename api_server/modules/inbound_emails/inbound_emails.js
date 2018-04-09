// the email module provides an email service to the api server

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');

const ROUTES = [
	// inbound email route, to be called periodically by the inbound email server
	// with data associated with a new inbound email
	{
		method: 'post',
		path: 'no-auth/inbound-email',
		requestClass: require('./inbound_email_request')
	}
];

class InboundEmails extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

}

module.exports = InboundEmails;
