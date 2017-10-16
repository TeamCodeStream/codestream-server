'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');
var Assert = require('assert');

class Get_One_By_Query_Skips_Cache_Test extends Data_Collection_Test {

	get description () {
		return 'should get no models when fetching one model by query, when that model has not yet been persisted';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.confirm_models_not_persisted
		], callback);
	}

	confirm_models_not_persisted (callback) {
		let ids = this.models.map(model => { return model.id; });
		this.mongo_data.test.get_by_ids(
			ids,
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array) || response.length !== 0) {
					return callback('models that should have gone to cache seem to have persisted');
				}
				callback();
			}
		);
	}

	run (callback) {
		let test_model = this.models[4];
		this.test_models = [];
		this.data.test.get_one_by_query(
			{
				text: test_model.get('text'),
				flag: test_model.get('flag')
			},
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		Assert(this.response === null, 'response not null');
	}
}

module.exports = Get_One_By_Query_Skips_Cache_Test;
