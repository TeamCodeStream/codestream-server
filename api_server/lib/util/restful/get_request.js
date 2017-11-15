'use strict';

var RestfulRequest = require('./restful_request');

class GetRequest extends RestfulRequest {

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

	process(callback) {
		let id = this.request.params.id;
		this.data[this.module.collectionName].getById(
			id,
			(error, model) => {
				this.gotModel(error, model, callback);
			}
		);
	}

	gotModel (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		if (!model) {
			return callback(this.errorHandler.error('notFound', { info: modelName }));
		}
		this.responseData = this.responseData || {};
		this.responseData[modelName] = model.getSanitizedObject();
		process.nextTick(callback);
	}
}

module.exports = GetRequest;
