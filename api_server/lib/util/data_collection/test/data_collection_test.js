'use strict';

var Generic_Test = require(process.env.CI_API_TOP + '/lib/test_base/generic_test');
var Mongo_Client = require(process.env.CI_API_TOP + '/lib/util/mongo/mongo_client.js');
var Test_API_Config = require(process.env.CI_API_TOP + '/config/api_test');
var Random_String = require('randomstring');
var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var Data_Collection = require('../data_collection');
var Data_Model = require('../data_model');

class Data_Collection_Test extends Generic_Test {

	before (callback) {
		this.mongo_client_factory = new Mongo_Client();
		const mongo_config = Object.assign({}, Test_API_Config.mongo, { collections: ['test'] });
		this.mongo_client_factory.open_mongo_client(
			mongo_config,
			(error, mongo_client) => {
				if (error) { return callback(error); }
				this.mongo_client = mongo_client;
				this.mongo_data = this.mongo_client.mongo_collections;
				this.data_collection = new Data_Collection({
					database_collection: this.mongo_data.test,
					model_class: Data_Model
				});
				this.data = { test: this.data_collection };
				callback();
			}
		);
	}

	create_test_and_control_model (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_model,
			this.create_control_model
		], callback);
	}

	create_test_model (callback) {
		this.test_model = new Data_Model({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5],
			object: {
				x: 1,
				y: 2.1,
				z: 'three'
			}
		});
		this.data.test.create(
			this.test_model.attributes,
			(error, created_model) => {
				if (error) { return callback(error); }
				this.test_model.id = this.test_model.attributes._id = created_model.id;
				callback();
			}
		);
	}

	create_control_model (callback) {
		this.control_model = new Data_Model({
			text: 'goodbye',
			number: 54321,
			array: [5, 4, 3, 2, 1],
			object: {
				x: 3,
				y: 2.2,
				z: 'one'
			}
		});
		this.data.test.create(
			this.control_model.attributes,
			(error, created_model) => {
				if (error) { return callback(error); }
				this.control_model.id = this.control_model.attributes._id = created_model.id;
				callback();
			}
		);
	}

	confirm_not_persisted (callback) {
		this.mongo_data.test.get_by_id(
			this.test_model.id,
			(error, response) => {
				if (error) { return callback(error); }
				if (response !== null) {
					return callback('model that should have gone to cache seems to have persisted');
				}
				callback();
			}
		);
	}

	create_random_models (callback) {
		this.models = new Array(10);
		this.randomizer = Random_String.generate(20);
		Bound_Async.times(
			this,
			10,
			this.create_one_random_model,
			callback
		);
	}

	want_n (n) {
		return n % 2 || n === 6;
	}

	create_one_random_model (n, callback) {
		let flag = this.randomizer + (this.want_n(n) ? 'yes' : 'no');
		this.models[n] = new Data_Model({
			text: 'hello' + n,
			number: n,
			flag: flag
		});
		this.data.test.create(
			this.models[n].attributes,
			(error, created_model) => {
				if (error) { return callback(error); }
				this.models[n].id = this.models[n].attributes._id = created_model.id;
				callback();
			}
		);
	}

	filter_test_models (callback) {
		this.test_models = this.models.filter(model => {
			return this.want_n(model.get('number'));
		});
		this.test_models.sort((a, b) => {
			return a.get('number') - b.get('number');
		});
		callback();
	}

	update_test_model (callback) {
		const update = {
			_id: this.test_model.id,
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_model.attributes, update);
				callback();
			}
		);
	}

	validate_model_response () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert(typeof this.response.attributes === 'object', 'improper fetched model');
		Assert.deepEqual(this.response.attributes, this.test_model.attributes, 'fetched model doesn\'t match');
	}

	validate_object_response () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert.deepEqual(this.response, this.test_model.attributes, 'fetched object doesn\'t match');
	}

	validate_array_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		let response_objects = this.response.map(model => { return model.attributes; });
		let test_objects = this.test_models.map(model => { return model.attributes; });
		response_objects.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(response_objects, test_objects, 'fetched models don\'t match');
	}

	persist (callback) {
		this.data.test.persist(callback);
	}

	clear_cache (callback) {
		this.data.test.clear();
		callback();
	}
}

module.exports = Data_Collection_Test;
