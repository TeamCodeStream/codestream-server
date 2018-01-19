// fulfill a restful DELETE request to delete (really deactivate) a document

'use strict';

var ModelDeleter = require('./model_deleter');
var RestfulRequest = require('./restful_request');

class DeleteRequest extends RestfulRequest {

	// process the request...
	process (callback) {
		// we have a standard model deleter class, but the derived module can
		// change the behavior by deriving its own deleter class
		let deleterClass = this.module.deleterClass || ModelDeleter;
		this.deleter = new deleterClass({
			request: this
		});
		this.deleter.deleteModel(
			this.request.params.id,
			(error, update) => {
				this.modelDeleted(error, update, callback);
			}
		);
	}

	// once the model has been deleted...
	modelDeleted (error, update, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		// since we're not really deleting the model, it really looks like
		// an update, and  the deleter tells us what the update was...
		// this is exactly what we send to the client
		this.responseData[modelName] = update;
		Object.assign(
			this.responseData,
			this.deleter.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = DeleteRequest;
