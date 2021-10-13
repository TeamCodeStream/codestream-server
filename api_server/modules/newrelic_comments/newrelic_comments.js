// provide a module to handle requests associated with the New Relic comments engine

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');

const ROUTES = [
	{
		method: 'post',
		path: 'nr-comments',
		requestClass: require('./post_nr_comment_request')
	},
	{
		method: 'get',
		path: 'nr-comments/:id',
		requestClass: require('./get_nr_comment_request')
	},
	{
		method: 'get',
		path: 'nr-comments',
		requestClass: require('./get_nr_comments_request')
	},
	{
		method: 'put',
		path: 'nr-comments/:id',
		requestClass: require('./put_nr_comment_request')
	},
	{
		method: 'delete',
		path: 'nr-comments/:id',
		requestClass: require('./delete_nr_comment_request')
	},
	{
		method: 'get',
		path: 'lookup-nr-org',
		requestClass: require('./lookup_nr_org_request')
	}
];

class NRComments extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}
}

module.exports = NRComments;
