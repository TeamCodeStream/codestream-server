'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var Company_Creator = require('./company_creator');
//var Company_Updater = require('./company_updater');
var Company = require('./company');

const COMPANY_STANDARD_ROUTES = {
	want: ['get', 'get_many'],
	base_route_name: 'companies',
	request_classes: {
		'get_many': require('./get_companies_request')
	}
};

const COMPANY_ADDITIONAL_ROUTES = [
	{
		method: 'get',
		path: COMPANY_STANDARD_ROUTES.base_route_name + '/:id',
		request_class: require('./get_companies_request')
	}
];

class Companies extends Restful {

	get collection_name () {
		return 'companies';
	}

	get model_name () {
		return 'company';
	}

	get creator_class () {
		return Company_Creator;
	}

	get model_class () {
		return Company;
	}

/*
	get updater_class () {
		return Company_Updater;
	}
*/

	get_routes () {
 		let standard_routes = super.get_routes(COMPANY_STANDARD_ROUTES);
		return [...standard_routes, ...COMPANY_ADDITIONAL_ROUTES];
	}
}

module.exports = Companies;
