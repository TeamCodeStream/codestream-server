// this class should be used to create all company documents in the database

'use strict';

var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Company = require('./company');

class CompanyCreator extends ModelCreator {

	get modelClass () {
		return Company;	// class to use to create a company model
	}

	get collectionName () {
		return 'companies'; // data collection to use
	}

	// convenience wrapper
	createCompany (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// these attributes are required or optional to create a company document,
	// others will be ignored
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['name']
			}
		};
	}

	// right before saving...
	preSave (callback) {
		this.attributes.creatorId = this.user.id;	// creator is the user making the request
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		super.preSave(callback);
	}
}

module.exports = CompanyCreator;
