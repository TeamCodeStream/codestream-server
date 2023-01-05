// this class should be used to update company documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Company = require('./company');
const CompanyValidations = require('./company_validations');

class CompanyUpdater extends ModelUpdater {

	get modelClass () {
		return Company;	// class to use to create a company model
	}

	get collectionName () {
		return 'companies';	// data collection to use
	}

	// convenience wrapper
	async updateCompany (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['name'],
			'array(string)': ['domainJoining']
		};
	}

	// validate the input attributes
	validateAttributes () {
		return CompanyValidations.validateAttributes(this.attributes);
	}

	// before the actual save
	async preSave () {
		// if changing name, change on New Relic IDP as well
		if (
			this.attributes.name &&
			this.request.api.services.idp &&
			this.request.company.get('linkedNROrgId')
		) {
			let mockResponse;
			if (this.request.request.headers['x-cs-no-newrelic']) {
				mockResponse = true;
				this.request.log('NOTE: not changing org name on New Relic, sending mock response instead');
			}
		
			await this.request.api.services.idp.changeOrgName(
				this.request.company.get('linkedNROrgId'),
				this.attributes.name,
				{ request: this.request, mockResponse }
			);
		}
		return super.preSave();
	}
}

module.exports = CompanyUpdater;
