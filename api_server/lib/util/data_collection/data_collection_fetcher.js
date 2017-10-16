'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Data_Collection_Fetcher {

	constructor (options) {
		Object.assign(this, options);
		this.request_id = (this.request && this.request.id) || this.request_id;
	}

	get_by_id (id, callback, options) {
		this.get_by_ids(
			[id],
			(error, models) => {
				if (error) { return callback(error); }
				let model = models.length > 0 ? models[0] : null;
				callback(null, model);
			},
			options
		);
	}

	get_by_ids (ids, callback, options) {
		this.database_options = Object.assign({}, options || {}, { request_id: this.request_id });
		this.ids = ids;
		Bound_Async.series(this, [
			this.get_from_cache,
			this.fetch,
			this.modelize,
			this.add
		], (error) => {
			if (error) { return callback(error); }
			let models = (this.cached_models || []).concat(this.fetched_models || []);
			callback(null, models);
		});
	}

	get_from_cache (callback) {
		this.cached_models = [];
		this.not_found = [];
		if (this.ids.length === 0) {
			return process.nextTick(callback);
		}
		Bound_Async.forEachLimit(
			this,
			this.ids,
			50,
			this.try_find_model,
			callback
		);
	}

	fetch (callback) {
		if (this.not_found.length === 0) {
			return callback();
		}
		else if (this.not_found.length === 1) {
			return this.fetch_one(callback);
		}
		else {
			return this.fetch_many(callback);
		}
	}

	fetch_one (callback) {
		this.database_collection.get_by_id(
			this.not_found[0],
			(error, document) => {
				if (error) { return callback(error); }
				if (document) {
					this.fetched_documents = [document];
				}
				process.nextTick(callback);
			},
			this.database_options
		);
	}

	fetch_many (callback) {
		this.database_collection.get_by_ids(
			this.not_found,
			(error, documents) => {
				if (error) { return callback(error); }
				this.fetched_documents = documents;
				process.nextTick(callback);
			},
			this.database_options
		);
	}

	try_find_model (id, callback) {
		let model = this.collection._get_from_cache(id);
		if (model) {
			this.cached_models.push(model);
		}
		else {
			this.not_found.push(id);
		}
		process.nextTick(callback);
	}

	modelize (callback) {
		this.fetched_models = [];
		Bound_Async.forEachLimit(
			this,
			this.fetched_documents,
			50,
			this.modelize_document,
			callback
		);
	}

	modelize_document (document, callback) {
		let model = new this.model_class(document);
		this.fetched_models.push(model);
		process.nextTick(callback);
	}

	add (callback) {
		this.collection._add_models_to_cache(this.fetched_models, callback);
	}
}

module.exports = Data_Collection_Fetcher;
