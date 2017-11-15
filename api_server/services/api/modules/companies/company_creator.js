'use strict';

var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Company = require('./company');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');

class CompanyCreator extends ModelCreator {

	get modelClass () {
		return Company;
	}

	get collectionName () {
		return 'companies';
	}

	createCompany (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	getRequiredAttributes () {
		return ['name'];
	}

	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['name']
			}
		);
		process.nextTick(callback);
	}

	preSave (callback) {
		this.attributes.creatorId = this.user.id;
		super.preSave(callback);
	}
}

module.exports = CompanyCreator;
