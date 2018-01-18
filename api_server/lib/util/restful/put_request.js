// fulfill a restful PUT request, update a document with attributes passed in

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
			request: this
		});
		this.updater.updateModel(
			this.request.params.id,
			this.request.body,
			(error, model) => {
				this.modelUpdated(error, model, callback);
			}
		);
	}

	// once the model has been updated...
	modelUpdated (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		// the updater tells us what the update was, this is exactly what we
		// send to the client
		this.responseData[modelName] = this.updater.update;
		Object.assign(
			this.responseData,
			this.updater.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = PutRequest;
