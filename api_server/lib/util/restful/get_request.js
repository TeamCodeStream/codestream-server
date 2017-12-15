// fulfill a restful GET request, fetching a single document

'use strict';

var RestfulRequest = require('./restful_request');

class GetRequest extends RestfulRequest {

	// authorize the client to fetch this model on behalf of the user
	authorize (callback) {
		return this.user.authorizeModel(
			this.module.modelName,
			this.request.params.id,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('readAuth'));
				}
				else {
					return process.nextTick(callback);
				}
			}
		);
	}

	// process the request...
	process(callback) {
		// fetch the document by ID
		let id = this.request.params.id;
		this.data[this.module.collectionName].getById(
			id,
			(error, model) => {
				this.gotModel(error, model, callback);
			}
		);
	}

	// called when we've fetched the document and now have a model
	gotModel (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		if (!model) {
			return callback(this.errorHandler.error('notFound', { info: modelName }));
		}
		this.responseData = this.responseData || {};
		// sanitize it for returning to client (eliminate any attributes we don't want the client to see)
		this.responseData[modelName] = model.getSanitizedObject();
		process.nextTick(callback);
	}
}

module.exports = GetRequest;
