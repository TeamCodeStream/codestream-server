// provides an abstract base class to handle the update of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process

'use strict';

const RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
const ModelSaver = require('./model_saver');

class ModelUpdater {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
	}

	// update the model
	async updateModel (id, attributes) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			throw this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` });
		}

		this.attributes = attributes;
		this.id = id;
		await this.normalize();				// normalize the input attributes
		await this.allowAttributes();		// discard attributes to ignore
		await this.validate();				// validate the attributes
		await this.preSave();				// prepare to save the document
		await this.update();				// do the actual update
		await this.postSave();				// give the derived class a chance to do stuff after we've saved
		return this.updateOp;
	}

	// normalize the input attributes ... override as needed
	async normalize () {
	}

	// ignore any attributes except those that are allowed
	async allowAttributes () {
		const attributes = this.getAllowedAttributes();
		if (attributes) {
			const info = RequireAllow.requireAllow(this.attributes, { optional: attributes });
			if (!info) {
				this.attributes.id = this.id;
			}
			else if (info.invalid) {
				throw this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') });
			}
			else if (info.deleted && this.request) {
				this.request.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
			}
		}
		this.attributes.id = this.id;
	}

	// which attributes are allowed? override to specify
	getAllowedAttributes () {
		return null;
	}

	// validate the input attributes
	async validate () {
		const error = await this.validateAttributes();
		if (error) {
			throw this.errorHandler.error('validation', { info: error });
		}
	}

	// validate the input attributes ... override as needed
	async validateAttributes () {
	}

	// perform any pre-save operations, override
	async preSave () {
	}

	// do the actual update
	async update () {
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.collection,
			modelClass: this.modelClass,
			id: this.id
		}).save(this.attributes);
	}

	// override to do stuff after the document has been saved
	async postSave () {
	}
}

module.exports = ModelUpdater;
