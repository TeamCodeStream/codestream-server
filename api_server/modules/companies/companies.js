'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const CompanyCreator = require('./company_creator');
const CompanyUpdater = require('./company_updater');
const Company = require('./company');

// we'll expose only these routes
const COMPANY_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put'],
	baseRouteName: 'companies',
	requestClasses: {
		'get': require('./get_company_request'),
		'getMany': require('./get_companies_request'),
		'post': require('./post_company_request'),
		'put': require('./put_company_request')
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
		method: 'put',
		path: '/companies/join/:id',
		requestClass: require('./join_company_request')
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

	// compile all the routes to expose
	getRoutes () {
		let standardRoutes = super.getRoutes(COMPANY_STANDARD_ROUTES);
		return [...standardRoutes, ...COMPANY_ADDITIONAL_ROUTES];
	}

}

module.exports = Companies;
