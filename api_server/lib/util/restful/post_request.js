// fulfill a restful POST request, creating a single document

'use strict';

const RestfulRequest = require('./restful_request');
const ModelCreator = require('./model_creator');

class PostRequest extends RestfulRequest {

	// process the request...
	async process () {
		// we have a standard model creator class, but the derived module can
		// change the behavior by deriving its own creator class
		const creatorClass = this.module.creatorClass || ModelCreator;
		this.creator = new creatorClass({
			request: this
		});
		const model = await this.creator.createModel(this.request.body);
		const modelName = this.module.modelName || 'model';
		// sanitize the model (eliminate attributes we don't want the client to see),
		// and set up the response to the client ... the creator class might have
		// additional information to put in the response, so handle that here as well
		this.responseData[modelName] = model.getSanitizedObject();
		Object.assign(
			this.responseData,
			this.creator.attachToResponse || {}
		);
	}

	// after the request has been processed and response returned to the client....
	async postProcess () {
		await this.creator.postCreate();
	}
}

module.exports = PostRequest;
