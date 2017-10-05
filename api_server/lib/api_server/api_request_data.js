'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection = require(process.env.CI_API_TOP + '/lib/util/data_collection/data_collection');

var Options_Symbol = Symbol('options');
var Collections_Symbol = Symbol('collections');

class API_Request_Data {

	constructor (options) {
		this[Options_Symbol] = options;
		this[Collections_Symbol] = {};
	}

	make_data (callback) {
		Bound_Async.forEachLimit(
			this,
			Object.keys(this[Options_Symbol].api.data),
			50,
			this.add_data_collection,
			callback
		);
	}

	add_data_collection (collection_name, callback) {
		var options = this[Options_Symbol];
		var model_class = this[Options_Symbol].api.config.data_collections[collection_name];
		var collection = new Data_Collection({
			database_collection: options.api.data[collection_name],
			model_class: model_class,
			request: options.request
		});
		this[Collections_Symbol][collection_name] = collection;
		this[collection_name] = collection;
		process.nextTick(callback);
	}

	persist (callback) {
		var collection_names = Object.keys(this[Collections_Symbol]);
		Bound_Async.forEachLimit(
			this,
			collection_names,
			10,
			this.persist_collection,
			callback
		);
	}

	persist_collection (collection_name, callback) {
		if (!this[collection_name]) { return callback(); }
		this[collection_name].persist(callback);
	}
}

module.exports = API_Request_Data;
