'use strict';

var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Company = require('./company');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');

class Company_Creator extends Model_Creator {

	get model_class () {
		return Company;
	}

	get collection_name () {
		return 'companies';
	}

	create_company (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['name']
			}
		);
		process.nextTick(callback);
	}

	validate_attributes (callback) {
		let required_attributes = ['name'];
		let error =	this.check_required(required_attributes);
		return process.nextTick(() => callback(error));
	}
}

module.exports = Company_Creator;
