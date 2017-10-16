'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Mongo_Bot {

	constructor (options) {
		Object.assign(this, options);
		this.iteration_data = {};
		this.errors = [];
	}

	foreach (collection, query, iterator, callback) {
		if (!this.mongo_client) {
			return callback('no mongo client');
		}
		if (!this.mongo_client.mongo_collections[collection]) {
			return callback('invalid collection: ' + collection);
		}
		this.iterator = iterator;
		this.mongo_client.mongo_collections[collection].get_by_query(
			query,
			(error, results) => {
				if (error) { return callback(error); }
				this.handle_cursor_results(results, callback);
			},
			{
				stream: true
			}
		);
	}

	handle_cursor_results (results, callback) {
		this.results = results;
		this.done = false;
		Bound_Async.whilst(
			this,
			() => {
				return !this.done;
			},
			(whilst_callback) => {
				this.results.cursor.nextObject((error, object) => {
					if (error) { return callback(error); }
					this.handle_next_object(object, whilst_callback);
				});
			},
			(error) => {
				callback(error);
			}
		);
	}

	handle_next_object (object, callback) {
		if (!object) {
			this.done = true;
			this.results.done();
			return process.nextTick(callback);
		}
		this.iterator(
			object,
			(error) => {
				if (error) {
					if (this.error_fatal) {
						this.done = true;
						return callback(error);
					}
					this.errors.push(error);
					if (this.logger) {
						this.logger.warn(error);
					}
				}
				const wait = this.throttle || 0;
				setTimeout(callback, wait);
			},
			this.iteration_data
		);
	}
}

module.exports = Mongo_Bot;
