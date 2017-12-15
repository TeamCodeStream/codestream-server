// fulfill a restful POST request, creating a single document

'use strict';

var RestfulRequest = require('./restful_request');
var ModelCreator = require('./model_creator');

class PostRequest extends RestfulRequest {

	// process the request...
	process (callback) {
		// we have a standard model creator class, but the derived module can
		// change the behavior by deriving its own creator class
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

	// once the model has been created...
	modelCreated (error, model, callback) {
		if (error) { return callback(error); }
		const modelName = this.module.modelName || 'model';
		// sanitize the model (eliminate attributes we don't want the client to see),
		// and set up the response to the client ... the creator class might have
		// additional information to put in the response, so handle that here as well
		this.responseData[modelName] = model.getSanitizedObject();
		Object.assign(
			this.responseData,
			this.creator.attachToResponse || {}
		);
		process.nextTick(callback);
	}
}

module.exports = PostRequest;
