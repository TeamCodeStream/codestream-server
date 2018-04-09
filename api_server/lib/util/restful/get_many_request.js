// fulfill a restful GET request, fetching multiple documents

'use strict';

const RestfulRequest = require('./restful_request');

class GetManyRequest extends RestfulRequest {

	// process the request...
	async process () {
		// let the derived class provide the details of the query based on the request parameters
		this.queryAndOptions = this.makeQueryAndOptions();
		if (!this.queryAndOptions.fetchNothing && !this.queryAndOptions.query) {
			throw this.queryAndOptions; // error
		}

		// do the fetch, with allowance for derived class to hook in both pre- and post-fetch
		await this.preFetchHook();
		await this.fetch();
		await this.postFetchHook();

		// sanitize the fetched models for return to the client
		// (remove attributes we don't want the client to see)
		const sanitizedObjects = await this.sanitizeModels(this.models);

		// respond to the client
		this.responseData = this.responseData || {};
		const collectionName = this.module.collectionName || 'objects';
		this.responseData[collectionName] = sanitizedObjects;
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
	async preFetchHook () {
	}

	// fetch the documents, based on the query the derived class gleaned from request parameters
	async fetch () {
		const { func, query, queryOptions, fetchNothing } = this.queryAndOptions;
		if (fetchNothing) {
			// the derived class might "know" that we're not going to fetch anything, so
			// don't bother running a query
			this.models = [];
			return;
		}
		// run the query and get our models
		this.models = await this.data[this.module.collectionName][func](query, queryOptions);
	}

	// override to do stuff right after we fetch the documents of interest
	async postFetchHook () {
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
