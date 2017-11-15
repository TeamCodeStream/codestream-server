'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class MongoBot {

	constructor (options) {
		Object.assign(this, options);
		this.iterationData = {};
		this.errors = [];
	}

	foreach (collection, query, iterator, callback) {
		if (!this.mongoClient) {
			return callback('no mongo client');
		}
		if (!this.mongoClient.mongoCollections[collection]) {
			return callback('invalid collection: ' + collection);
		}
		this.iterator = iterator;
		this.mongoClient.mongoCollections[collection].getByQuery(
			query,
			(error, results) => {
				if (error) { return callback(error); }
				this.handleCursorResults(results, callback);
			},
			{
				stream: true
			}
		);
	}

	handleCursorResults (results, callback) {
		this.results = results;
		this.done = false;
		BoundAsync.whilst(
			this,
			() => {
				return !this.done;
			},
			(whilstCallback) => {
				this.results.cursor.nextObject((error, object) => {
					if (error) { return callback(error); }
					this.handleNextObject(object, whilstCallback);
				});
			},
			(error) => {
				callback(error);
			}
		);
	}

	handleNextObject (object, callback) {
		if (!object) {
			this.done = true;
			this.results.done();
			return process.nextTick(callback);
		}
		this.iterator(
			object,
			(error) => {
				if (error) {
					if (this.errorFatal) {
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
			this.iterationData
		);
	}
}

module.exports = MongoBot;
