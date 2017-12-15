// fulfill a restful PUT request, update a document with attributes passed in
// NOTE - we're not really supporting this yet

'use strict';

var ModelUpdater = require('./model_updater');
var RestfulRequest = require('./restful_request');

class PutRequest extends RestfulRequest {

	// process the request...
	process (callback) {
		// we have a standard model updater class, but the derived module can
		// change the behavior by deriving its own updater class
		let updaterClass = this.module.updaterClass || ModelUpdater;
		this.updater = new updaterClass({
			module: this,
			user: this.user,
			logger: this.api,
			errorHandler: this.errorHandler
		}).updateModel(
			this.request.body,
			(error, model) => {
				this.modelUpdated(error, model, callback);
			}
		);
	}

	// once the model has been created...
	modelUpdated (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		// sanitize the model (eliminate attributes we don't want the client to see),
		// and set up the response to the client ... the creator class might have
		// additional information to put in the response, so handle that here as well
		this.responseData[modelName] = model.getSanitizedObject();
		Object.assign(
			this.responseData,
			this.updater.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = PutRequest;
