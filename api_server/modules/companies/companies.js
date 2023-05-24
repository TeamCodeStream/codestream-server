'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const CompanyCreator = require('./company_creator');
const CompanyUpdater = require('./company_updater');
const CompanyDeleter = require('./company_deleter');
const Company = require('./company');

// we'll expose only these routes
const COMPANY_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put', 'delete'],
	baseRouteName: 'companies',
	requestClasses: {
		'get': require('./get_company_request'),
		'getMany': require('./get_companies_request'),
		'post': require('./post_company_request'),
		'put': require('./put_company_request'),
		'delete': require('./delete_company_request')
	}
};

// expose additional routes
const COMPANY_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: '/company-test-group/:id',
		requestClass: require('./put_company_test_group_request')
	},
	{
		// NOTE: this request is deprecated as of one-user-per-org
		method: 'put',
		path: '/companies/join/:id',
		requestClass: require('./join_company_request')
	},
	{
		method: 'post',
		path: '/companies/add-nr-info/:id',
		requestClass: require('./add_nr_info_request')
	},

	// this request will be callable through Service Gateway using a CodeStream-issued
	// access token
	{
		method: 'post',
		path: 'cs-auth/companies',
		requestClass: require('./post_company_request')
	}
];

class Companies extends Restful {

	get collectionName () {
		return 'companies';	// name of the data collection
	}

	get modelName () {
		return 'company'; // name of the data model
	}

	get modelDescription () {
		return 'A single company, owning one or more teams';
	}

	get creatorClass () {
		return CompanyCreator; // derived from ModelCreator, class to use to create a company model
	}

	get modelClass () {
		return Company;	// derived from DataModel, class to use for a company model
	}

	get updaterClass () {
		return CompanyUpdater;
	}

	get deleterClass () {
		return CompanyDeleter;
	}

	// compile all the routes to expose
	getRoutes () {
		let standardRoutes = super.getRoutes(COMPANY_STANDARD_ROUTES);
		return [...standardRoutes, ...COMPANY_ADDITIONAL_ROUTES];
	}

}

module.exports = Companies;
