'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var CompanyCreator = require('./company_creator');
//var CompanyUpdater = require('./company_updater');
var Company = require('./company');

const COMPANY_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'companies',
	requestClasses: {
		'getMany': require('./get_companies_request')
	}
};

class Companies extends Restful {

	get collectionName () {
		return 'companies';
	}

	get modelName () {
		return 'company';
	}

	get creatorClass () {
		return CompanyCreator;
	}

	get modelClass () {
		return Company;
	}

/*
	get updaterClass () {
		return CompanyUpdater;
	}
*/

	getRoutes () {
		return super.getRoutes(COMPANY_STANDARD_ROUTES);
	}
}

module.exports = Companies;
