'use strict';

var RestfulRequest = require('./restful_request');
var ModelCreator = require('./model_creator');

class PostRequest extends RestfulRequest {

	process (callback) {
		let creatorClass = this.module.creatorClass || ModelCreator;
		this.creator = new creatorClass({
			request: this
		});
		this.creator.createModel(
			this.request.body,
			(error, model) => {
				this.modelCreated(error, model, callback);
			}
		);
	}

	modelCreated (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		this.responseData[modelName] = model.getSanitizedObject();
		Object.assign(
			this.responseData,
			this.creator.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = PostRequest;
