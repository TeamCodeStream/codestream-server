'use strict';

var Model_Creator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Company = require('./company');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');

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

	get_required_attributes () {
		return ['name'];
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

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		super.pre_save(callback);
	}
}

module.exports = Company_Creator;
