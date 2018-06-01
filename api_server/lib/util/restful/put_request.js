// fulfill a restful PUT request, update a document with attributes passed in

'use strict';

const ModelUpdater = require('./model_updater');
const RestfulRequest = require('./restful_request');

class PutRequest extends RestfulRequest {

	// process the request...
	async process () {
		// we have a standard model updater class, but the derived module can
		// change the behavior by deriving its own updater class
		const updaterClass = this.module.updaterClass || ModelUpdater;
		this.updater = new updaterClass({
			request: this
		});
		await this.updater.updateModel(
			this.request.params.id,
			this.request.body
		);
		const modelName = this.module.modelName || 'model';
		// the updater tells us what the update was, this is exactly what we
		// send to the client
		this.responseData[modelName] = this.updater.updatedAttributes;
		Object.assign(
			this.responseData,
			this.updater.attachToResponse || {}
		);
	}

	// describe this route for help
	static describe (module) {
		const { modelName } = module;
		return {
			tag: `put-${modelName}`,
			summary: `Updates an existing ${modelName}`,
			description: `Updates an existing ${modelName} with attributes given`,
			input: `Specify the ID of the ${modelName} to update in the path, and specify attributes to update in the body`,
			returns: {
				summary: `Updated attributes plus possible directives within a ${modelName} object`,
				looksLike: {
					[modelName]: `<@@#${modelName} object#${modelName}@@>`
				}
			},
			errors: [
				'updateAuth',
				'notFound',
				'invalidParameter',
				'validation'
			]
		};
	}
}

module.exports = PutRequest;
