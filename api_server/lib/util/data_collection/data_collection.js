'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Fetcher = require('./data_collection_fetcher');
var Model_Ops = require('./model_ops');
var Error_Handler = require(process.env.CI_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

class Data_Collection {

	constructor (options) {
		this.options = options;
		this.id_attribute = this.options.id_attribute || '_id';
		this.database_collection = this.options.database_collection;
		this.model_class = this.options.model_class;
		if (!this.database_collection) {
			throw 'database_collection must be provided to Data_Collection';
		}
		if (!this.model_class) {
			throw 'model_class must be provided to Data_Collection';
		}
		this.request_id = this.options.request && this.options.request.id;
		this.error_handler = new Error_Handler(Errors);
		this.fetch_options = {
			collection: this,
			database_collection: this.database_collection,
			model_class: this.model_class,
			id_attribute: this.id_attribute,
			request_id: this.request_id
		};
		this.clear();
	}

	clear () {
		this.models = {};
		this.model_ops = {};
		this.dirty_model_ids = {};
		this.to_delete_ids = {};
		this.to_create_ids = {};
	}

	get_by_id (id, callback, options) {
		new Data_Collection_Fetcher(this.fetch_options).get_by_id(
			id,
			callback,
			options
		);
	}

	get_by_ids (ids, callback, options) {
		new Data_Collection_Fetcher(this.fetch_options).get_by_ids(
			ids,
			callback,
			options
		);
	}

	get_by_query (conditions, callback, options) {
		options = options || {};
		this.database_collection.get_by_query(
			conditions,
			(error, documents) => {
				if (error) { return callback(error); }
				this._add_documents_to_cache(documents, callback);
			},
			Object.assign({}, options.database_options, { request_id: this.request_id })
		);
	}

	get_one_by_query (conditions, callback, options) {
		options = options || {};
		this.database_collection.get_one_by_query(
			conditions,
			(error, document) => {
				if (error) { return callback(error); }
				let model = null;
				if (document) {
					model = this._add_data_to_cache(document);
				}
				return callback(null, model);
			},
			Object.assign({}, options.database_options, { request_id: this.request_id })
		);
	}

	create (data, callback) {
		let id = (data[this.id_attribute] || this.create_id()).toString();
		data[this.id_attribute] = id;
		let model = new this.model_class(data);
		this.add_model_to_cache(model);
		delete this.dirty_model_ids[id];
		delete this.to_delete_ids[id];
		delete this.model_ops[id];
		this.to_create_ids[id] = true;
		return callback(null, model);
	}

	create_id () {
		return this.database_collection.create_id().toString();
	}

	update (data, callback, options = {}) {
		let id = data[this.id_attribute] || options.id;
		if (!id) {
			return callback(this.error_handler.error('id', { info: this.id_attribute }));
		}
		data[this.id_attribute] = id;
		this._add_data_to_cache(data);
		if (!this.to_create_ids[id]) {
			this.dirty_model_ids[id] = true;
		}
		let model = this._get_from_cache(id);
		process.nextTick(() => {
			callback(null, model);
		});
	}

	apply_op_by_id (id, op, callback) {
		this._add_model_op(id, op);
		let model = this._get_from_cache(id);
		process.nextTick(() => {
			callback(null, model);
		});
	}

	delete_by_id (id, callback) {
		this._remove_model_from_cache(id);
		this.to_delete_ids[id] = true;
		process.nextTick(callback);
	}

	update_direct (query, data, callback, options = {}) {
		this.database_collection.update_direct(
			query,
			data,
			callback,
			Object.assign({}, options, { request_id: this.request_id })
		);
	}

	persist (callback) {
		Bound_Async.series(this, [
			this._persist_documents,
			this._delete_documents,
			this._create_documents
		], callback);
	}

	_get_from_cache (id) {
		return this.models[id];
	}

	_add_data_to_cache (data, callback) {
		let id = data[this.id_attribute];
		let model = this.models[id];
		if (model) {
			Object.assign(model.attributes, data);
		}
		else {
			model = new this.model_class(data);
			this.add_model_to_cache(model);
		}
		if (callback) {
			return callback(null, model);
		}
		else {
			return model;
		}
	}

	_add_documents_to_cache (documents, callback) {
		let models = [];
		Bound_Async.forEachLimit(
			this,
			documents,
			50,
			(document, foreach_callback) => {
				let model = this._add_data_to_cache(document);
				models.push(model);
				process.nextTick(foreach_callback);
			},
			() => {
				callback(null, models);
			}
		);
	}

	add_model_to_cache (model, callback) {
		let id = model.id;
		let model_ops = this.model_ops[id];
		let cached_model = this.models[id];
		if (cached_model) {
			if (model_ops) {
				model_ops.push({ set: model.attributes });
			}
			else {
				Object.assign(cached_model.attributes, model.attributes);
			}
		}
		else {
			this.models[id] = model;
		}
		return callback && process.nextTick(callback);
	}

	_add_models_to_cache (models, callback) {
		Bound_Async.forEachLimit(
			this,
			models,
			50,
			this.add_model_to_cache,
			callback
		);
	}

	_remove_model_from_cache (id) {
		delete this.models[id];
		delete this.model_ops[id];
		delete this.dirty_model_ids[id];
		delete this.to_create_ids[id];
	}

	_add_model_op (id, op) {
		let is_dirty = this.dirty_model_ids[id] || this.to_create_ids[id];
		let cached_model = this.models[id];
		if (!cached_model) {
			this.models[id] = new this.model_class({ [this.id_attribute]: id });
		}
		this.model_ops[id] = this.model_ops[id] || [];
		if (cached_model && is_dirty && this.model_ops[id].length === 0) {
			this.model_ops[id].push({ set: cached_model.attributes });
		}
		this.model_ops[id].push(op);
		if (!this.to_create_ids[id]) {
			this.dirty_model_ids[id] = true;
		}
		Model_Ops.apply_op(this.models[id], op);
	}

	_persist_documents (callback) {
		Bound_Async.forEachLimit(
			this,
			Object.keys(this.dirty_model_ids),
			50,
			this._persist_document,
			callback
		);
	}

	_persist_document (id, callback) {
		let model_ops = this.model_ops[id];
		if (model_ops && model_ops.length > 0) {
			return this._persist_document_by_ops(id, model_ops, callback);
		}
		let model = this._get_from_cache(id);
		if (!model) { return process.nextTick(callback); }
		model.attributes[this.id_attribute] = id;
		this.database_collection.update(
			model.attributes,
			(error, updated_model) => {
				if (error) { return callback(error); }
				this.add_model_to_cache(updated_model);
				delete this.model_ops[id];
				delete this.dirty_model_ids[id];
				process.nextTick(callback);
			},
			Object.assign({}, this.options.database_options, { request_id: this.request_id })
		);
	}

	_persist_document_by_ops (id, ops, callback) {
		this.database_collection.apply_ops_by_id(
			id,
			ops,
			(error) => {
				if (error) { return callback(error); }
				delete this.model_ops[id];
				delete this.dirty_model_ids[id];
				callback();
			},
			Object.assign({}, this.options.database_options, { request_id: this.request_id })
		);
	}

	_create_documents (callback) {
		Bound_Async.forEachLimit(
			this,
			Object.keys(this.to_create_ids),
			20,
			this._create_document,
			callback
		);
	}

	_create_document (id, callback) {
		let model = this._get_from_cache(id);
		this.database_collection.create(
			model.attributes,
			(error, created_document) => {
				if (error) { return callback(error); }
				this._add_data_to_cache(created_document);
				delete this.to_create_ids[id];
				process.nextTick(callback);
			},
			Object.assign({}, this.options.database_options, { request_id: this.request_id })
		);
	}

	_delete_documents (callback) {
		Bound_Async.forEachLimit(
			this,
			Object.keys(this.to_delete_ids),
			50,
			this._delete_document,
			callback
		);
	}

	_delete_document (id, callback) {
		this.database_collection.delete_by_id(
			id,
			(error) => {
				if (error) { return callback(error); }
				this._remove_model_from_cache(id);
				delete this.to_delete_ids[id];
				process.nextTick(callback);
			},
			Object.assign({}, this.options.database_options, { request_id: this.request_id })
		);
	}

	object_id_safe (id) {
		return this.database_collection.object_id_safe(id);
	}
}

module.exports = Data_Collection;
