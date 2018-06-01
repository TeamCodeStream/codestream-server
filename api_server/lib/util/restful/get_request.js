// fulfill a restful GET request, fetching a single document

'use strict';

const RestfulRequest = require('./restful_request');

class GetRequest extends RestfulRequest {

	// authorize the client to fetch this model on behalf of the user
	async authorize () {
		const authorized = await this.user.authorizeModel(
			this.module.modelName,
			this.request.params.id,
			this
		);
		if (!authorized) {
			throw this.errorHandler.error('readAuth');
		}
	}

	// process the request...
	async process() {
		// fetch the document by ID
		let id = this.request.params.id;
		const model = await this.data[this.module.collectionName].getById(id);
		const modelName = this.module.modelName || 'model';
		if (!model) {
			throw this.errorHandler.error('notFound', { info: modelName });
		}
		this.responseData = this.responseData || {};
		// sanitize it for returning to client (eliminate any attributes we don't want the client to see)
		this.responseData[modelName] = model.getSanitizedObject();
	}

	// describe this route for help
	static describe (module) {
		const { modelName } = module;
		return {
			tag: `get-${modelName}`,
			summary: `Gets a single ${modelName}`,
			description: `Returns a single ${modelName} as specified by ID`,
			input: `Specify the ${modelName} ID in the path`,
			returns: {
				summary: `A ${modelName} object`,
				looksLike: {
					[modelName]: `<@@#${modelName} object#${modelName}@@>`
				}
			},
			access: '(rule unknown)',
			errors: [
				'readAuth',
				'notFound'
			]
		};
	}


}

module.exports = GetRequest;
