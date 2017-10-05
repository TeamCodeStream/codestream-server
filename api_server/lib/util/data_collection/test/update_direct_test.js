'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');
var Assert = require('assert');
var Random_String = require('randomstring');

class Update_Direct_Test extends Data_Collection_Test {

	get_description () {
		return 'should get the correct models after they are directly updated';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.persist,
			this.clear_cache,
			this.update_models
		], callback);
	}

	update_models (callback) {
		var regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.update_direct(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	run (callback) {
		var ids = this.models.map(model => { return model.id; });
		this.mongo_data.test.get_by_ids(
			ids,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
console.warn('r', this.response);
console.warn('d', this.models);
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.models.length);
		this.response.forEach(response_object => {
			if (this.want_n(response_object.number)) {
				Assert(response_object.text === 'goodbye', `expected model ${response_object._id} wasn't updated`);
			}
			else {
				Assert(response_object.text === 'hello' + response_object.number, `model ${response_object._id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = Update_Direct_Test;
