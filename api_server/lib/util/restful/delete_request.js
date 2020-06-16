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
	}

	// describe this route for help
	static describe (module) {
		const { modelName } = module;
		return {
			tag: `delete-${modelName}`,
			summary: `Deletes (deactivates) an existing ${modelName}`,
			description: `Deletes (deactivates) an existing ${modelName}`,
			input: `Specify the ${modelName} ID in the path`,
			returns: {
				[modelName]: {
					id: `<${modelName} ID>`,
					$set: {
						deactivated: true
					}
				}
			},
			errors: [
				'deleteAuth',
				'notFound'
			]
		};
	}
}

module.exports = DeleteRequest;
