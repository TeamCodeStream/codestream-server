// fulfill a restful DELETE request to delete (really deactivate) a document

'use strict';

const ModelDeleter = require('./model_deleter');
const RestfulRequest = require('./restful_request');

class DeleteRequest extends RestfulRequest {

	// process the request...
	async process () {
		// we have a standard model deleter class, but the derived module can
		// change the behavior by deriving its own deleter class
		const deleterClass = this.module.deleterClass || ModelDeleter;
		this.deleter = new deleterClass({
			request: this
		});
		const update = await this.deleter.deleteModel(this.request.params.id);
		const modelName = this.module.modelName || 'model';
		// since we're not really deleting the model, it really looks like
		// an update, and  the deleter tells us what the update was...
		// this is exactly what we send to the client
		this.responseData[modelName] = update;
		Object.assign(
			this.responseData,
			this.deleter.attachToResponse || {}
		);
	}
}

module.exports = DeleteRequest;
