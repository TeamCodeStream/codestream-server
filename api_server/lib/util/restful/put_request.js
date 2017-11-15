'use strict';

var ModelUpdater = require('./model_updater');
var RestfulRequest = require('./restful_request');

class PutRequest extends RestfulRequest {

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
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

	modelUpdated (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		this.responseData[modelName] = model.getSanitizedObject();
		Object.assign(
			this.responseData,
			this.updater.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = PutRequest;
