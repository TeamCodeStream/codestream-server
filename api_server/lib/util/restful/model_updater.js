// provides an abstract base class to handle the update of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process

'use strict';

const RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class ModelUpdater {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};	// additional material we want to get returned to the client
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
		this.checkValidationWarnings();		// check for any validation warnings that came up in preSave
		await this.update();				// update the document
		await this.postSave();				// give the derived class a chance to do stuff after we've saved
		return this.model;
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
				this.attributes[this.collection.idAttribute] = this.id;
			}
			else if (info.invalid) {
				throw this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') });
			}
			else if (info.deleted && this.api) {
				this.api.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
			}
		}
		this.attributes[this.collection.idAttribute] = this.id;
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

	// called right before we save
	async preSave () {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens ... note that since we're doing an update, we might not have
		// (and actually probably don't) have a complete model here
		this.extractOps();
		this.model = new this.modelClass(this.attributes, { dontSetDefaults: true });
		try {
			await this.model.preSave();
		}
		catch (error) {
			throw this.errorHandler.error('validation', { info: error });
		}
	}

	// extract any op-directives from the attributes, these are treated separately
	extractOps () {
		const opKeys = Object.keys(this.attributes).filter(attribute => attribute.startsWith('$'));
		if (opKeys.length === 0) {
			return;
		}
		this.ops = { };
		Object.keys(this.attributes).forEach(attribute => {
			if (attribute.startsWith('$')) {
				this.ops[attribute] = Object.assign(this.ops[attribute] || {}, this.attributes[attribute]);
				delete this.attributes[attribute];
			}
			else if (attribute !== this.collection.idAttribute) {
				this.ops.$set = this.ops.$set || {};
				this.ops.$set[attribute] = DeepClone(this.attributes[attribute]);
			}
		});
	}

	// check for any warnings during validation, these don't stop the document from
	// getting saved but we'll want to log them anyway
	checkValidationWarnings () {
		if (
			this.model.validationWarnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validationWarnings.join('\n')}`);
		}
	}

	// do the actual update
	async update () {
		// do the update
		if (this.ops) {
			this.updatedAttributes = Object.assign({}, this.ops, { _id: this.id });
			await this.collection.applyOpById(this.id, this.ops);
			this.updatedAttributes.$set = this.model.validator.sanitizeAttributes(this.updatedAttributes.$set);
		}
		else {
			this.updatedAttributes = DeepClone(this.model.attributes);
			const set = DeepClone(this.updatedAttributes);
			delete set._id;
			await this.collection.applyOpById(this.id, { $set: set });
			this.updatedAttributes = this.model.validator.sanitizeAttributes(this.updatedAttributes);
		}
	}

	// override to do stuff after the document has been saved
	async postSave () {
	}
}

module.exports = ModelUpdater;
