'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Restful_Request = require('./restful_request');

class Get_Many_Request extends Restful_Request {

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		Bound_Async.series(this, [
			this.fetch,
			this.sanitize,
			this.respond
		], callback);
	}

	fetch (callback) {
		let query_and_options = this.make_query_and_options();
		if (!query_and_options.query) {
			return callback(query_and_options); // error
		}
		let { query, query_options } = query_and_options;
		this.data[this.module.collection_name][func](
			query,
			(error, models) => {
				if (error) { return callback(error); }
				this.models = models;
				callback();
			},
			query_options
		);
	}

	make_query_and_options () {
		let query = this.build_query();
		if (typeof query === 'string') {
			return this.error_handler.error('bad_query', { reason: query });
		}
		let query_options = this.get_query_options();
		let func;
		if (query) {
			func = 'get_by_query';
		}
		else {
			func = 'get_by_ids';
			query = this.request.query.ids || this.request.body.ids;
			if (!query) {
				return this.error_handler.error('parameter_required', { info: 'ids' });
			}
			query = query.split(',');
		}
		return { query, query_options };
	}

	sanitize (callback) {
		this.sanitized_objects = [];
		Bound_Async.forEachLimit(
			this,
			this.models,
			20,
			this.sanitize_model,
			callback
		);
	}

	sanitize_model (model, callback) {
		this.sanitized_objects.push(model.get_sanitized_object());
		process.nextTick(callback);
	}

	respond (callback) {
		this.response_data = this.response_data || {};
		var collection_name = this.module.collection_name || 'objects';
		this.response_data[collection_name] = this.sanitized_objects;
		process.nextTick(callback);
	}

	build_query () {
		return null;
	}

	get_query_options () {
		return {};
	}
}

module.exports = Get_Many_Request;
