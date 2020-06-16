// Provides an independent bot that can perform operations on data from a mongo database

'use strict';

var BoundAsync = require('../bound_async');

class MongoBot {

	constructor (options) {
		Object.assign(this, options);
		this.iterationData = {};
		this.errors = [];
	}

	// for each document in the collection that matches the query, perform an operation (iterator)
	foreach (collection, query, iterator, callback) {
		if (!this.mongoClient) {
			return callback('no mongo client');
		}
		if (!this.mongoClient.mongoCollections[collection]) {
			return callback('invalid collection: ' + collection);
		}
		this.iterator = iterator;
		// run the query
		this.mongoClient.mongoCollections[collection].getByQuery(
			query,
			(error, results) => {
				if (error) { return callback(error); }
				// handle the results
				this.handleCursorResults(results, callback);
			},
			{
				stream: true
			}
		);
	}

	// once we get the results back from the query, start iterating over the objects and
	// handle the results
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

	// handle a single fetched object by calling the passed iterator
	handleNextObject (object, callback) {
		if (!object) {
			// no more objects
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
