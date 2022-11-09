// provides a service to the API server which manages concerns related to environment hosts

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const EnvironmentManagerService = require('./environment_manager_service');

const ROUTES = [
	{
		method: 'get',
		path: 'xenv/fetch-user',
		requestClass: require('./fetch_user_request')
	},
	{
		method: 'post',
		path: 'xenv/ensure-user',
		requestClass: require('./ensure_user_request')
	},
	{
		method: 'post',
		path: 'xenv/confirm-user',
		requestClass: require('./confirm_user_request')
	},
	{
		method: 'get',
		path: 'xenv/eligible-join-companies',
		requestClass: require('./eligible_join_companies_request')
	},
	{ // deprecate this call when we have fully moved to ONE_USER_PER_ORG
		method: 'get',
		path: '/xenv/user-companies',
		requestClass: require('./user_companies_request')
	},
	{
		method: 'put',
		path: '/xenv/change-email',
		requestClass: require('./change_email_request')
	},
	{
		method: 'put',
		path: '/xenv/join-company/:id',
		requestClass: require('./join_company_request')
	},
	{
		method: 'post',
		path: '/create-xenv-company',
		requestClass: require('./create_company_request')
	},
	{
		method: 'delete',
		path: '/xenv/delete-user/:id',
		requestClass: require('./delete_user_request')
	},
	{
		method: 'post',
		path: '/xenv/publish-ejc',
		requestClass: require('./publish_eligible_join_companies_request')
	}
];

class EnvironmentManager extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	services () {
		// return a function that, when invoked, will return a service structure with 
		// environment management as a service to the API server app 
		return async () => {
			this.api.log('Instantiating environment manager service...');
			this.environmentManager = new EnvironmentManagerService({ 
				api: this.api
			});
			return { environmentManager: this.environmentManager };
		};
	}
}

module.exports = EnvironmentManager;
