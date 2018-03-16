'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var CompanyCreator = require('./company_creator');
//var CompanyUpdater = require('./company_updater');
var Company = require('./company');

// we'll expose only these routes
const COMPANY_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'companies',
	requestClasses: {
		'getMany': require('./get_companies_request')
	}
};

class Companies extends Restful {

	get collectionName () {
		return 'companies';	// name of the data collection
	}

	get modelName () {
		return 'company'; // name of the data model
	}

	get creatorClass () {
		return CompanyCreator; // derived from ModelCreator, class to use to create a company model
	}

	get modelClass () {
		return Company;	// derived from DataModel, class to use for a company model
	}

	/*
	get updaterClass () {
		return CompanyUpdater;
	}
*/

	getRoutes () {
		// routes the module will expose
		return super.getRoutes(COMPANY_STANDARD_ROUTES);
	}
}

module.exports = Companies;
