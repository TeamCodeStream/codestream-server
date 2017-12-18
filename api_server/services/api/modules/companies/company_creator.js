// this class should be used to create all company documents in the database

'use strict';

var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Company = require('./company');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');

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

	// these attributes are required to create a company document
	getRequiredAttributes () {
		return ['name'];
	}

	// ignore any attributes but these to create a company document
	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['name']
			}
		);
		process.nextTick(callback);
	}

	// right before saving...
	preSave (callback) {
		this.attributes.creatorId = this.user.id;	// creator is the user making the request
		super.preSave(callback);
	}
}

module.exports = CompanyCreator;
