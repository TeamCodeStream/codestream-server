// fulfill a restful GET request, fetching multiple documents

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RestfulRequest = require('./restful_request');

class GetManyRequest extends RestfulRequest {

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.formQuery,		// let the derived class provide the details of the query based on the request parameters
			this.preFetchHook,	// let the derived class do more stuff as needed
			this.fetch,			// run the query and fetch the documents
			this.postFetchHook,	// let the derived class do stuff after the data is retrieved
			this.sanitize,		// sanitize the documents for returning to the client
			this.respond		// respond to the client
		], callback);
	}

	// form a query and query options based on information the client gleans from the request parameters
	formQuery (callback) {
		this.queryAndOptions = this.makeQueryAndOptions();
		if (!this.queryAndOptions.fetchNothing && !this.queryAndOptions.query) {
			return callback(this.queryAndOptions); // error
		}
		process.nextTick(callback);
	}

	// override to do stuff right before we fetch
	preFetchHook (callback) {
		callback();
	}

	// fetch the documents, based on the query the derived class gleaned from request parameters
	fetch (callback) {
		let { func, query, queryOptions } = this.queryAndOptions;
		if (this.queryAndOptions.fetchNothing) {
			// the derived class might "know" that we're not going to fetch anything, so
			// don't bother running a query
			this.models = [];
			return callback();
		}
		// run the query and get our models
		this.data[this.module.collectionName][func](
			query,
			(error, models) => {
				if (error) { return callback(error); }
				this.models = models;
				callback();
			},
			queryOptions
		);
	}

	// override to do stuff right after we fetch the documents of interest
	postFetchHook (callback) {
		callback();
	}
	
	// make our fetch query and any associated query options
	makeQueryAndOptions () {
		// build the query (this is where the derived class does its work)
		let query = this.buildQuery();
		if (typeof query === 'string') {
			// an error in the query parameters
			return this.errorHandler.error('badQuery', { reason: query });
		}
		else if (query === false) {
			// fetch nothing
			return { fetchNothing: true };
		}
		// get options associated with the query we'll run
		let queryOptions = this.getQueryOptions();
		let func;
		if (query) {
			func = 'getByQuery';
		}
		else {
			// we assume if we didn't get a query, that the client wants to fetch documents by ID
			func = 'getByIds';
			query = this.ids || this.request.query.ids || this.request.body.ids;
			if (!query) {
				return this.errorHandler.error('parameterRequired', { info: 'ids' });
			}
			if (typeof query === 'string') {
				query = decodeURIComponent(query).toLowerCase().split(',');
			}
		}
		return { func, query, queryOptions };
	}

	// sanitize the fetched models for return to the client
	// (remove attributes we don't want the client to see)
	sanitize (callback) {
		this.sanitizeModels(
			this.models,
			(error, objects) => {
				if (error) { return callback(error); }
				this.sanitizedObjects = objects;
				callback();
			}
		);
	}

	// respond to the client with our now-sanitized objects
	respond (callback) {
		this.responseData = this.responseData || {};
		const collectionName = this.module.collectionName || 'objects';
		this.responseData[collectionName] = this.sanitizedObjects;
		process.nextTick(callback);
	}

	// derived class will usually override this
	buildQuery () {
		return null;
	}

	// derived class may also override this
	getQueryOptions () {
		return {};
	}
}

module.exports = GetManyRequest;
