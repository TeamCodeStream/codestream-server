// provides an abstract base class to handle the update of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RequireAllow = require(process.env.CS_API_TOP + '/server_utils/require_allow');
var DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class ModelUpdater {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};	// additional material we want to get returned to the client
	}

	// update the model
	updateModel (id, attributes, callback) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			return callback(this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` }));
		}

		this.attributes = attributes;
		this.id = id;
		BoundAsync.series(this, [
			this.normalize,				// normalize the input attributes
			this.allowAttributes,		// discard attributes to ignore
			this.validate,				// validate the attributes
			this.preSave,				// prepare to save the document
			this.checkValidationWarnings,	// check for any validation warnings that came up in preSave
			this.update,				// update the document
			this.postSave				// give the derived class a chance to do stuff after we've saved
		], (error) => {
	 		callback(error, this.model);
		});
	}

	// normalize the input attributes ... override as needed
	normalize (callback) {
		process.nextTick(callback);
	}

	// ignore any attributes except those that are allowed
	allowAttributes (callback) {
		let attributes = this.getAllowedAttributes();
		if (attributes) {
			let info = RequireAllow.requireAllow(this.attributes, { optional: attributes });
			if (!info) {
				this.attributes[this.collection.idAttribute] = this.id;
			}
			else if (info.invalid) {
				return callback(this.errorHandler.error('invalidParameter', { info: info.invalid.join(',') }));
			}
			else if (info.deleted && this.api) {
				this.api.warn(`These attributes were deleted: ${info.deleted.join(',')}`);
			}
		}
		this.attributes[this.collection.idAttribute] = this.id;
		process.nextTick(callback);
	}

	// which attributes are allowed? override to specify
	getAllowedAttributes () {
		return null;
	}

	// validate the input attributes
	validate (callback) {
		this.validateAttributes((errors) => {
			if (errors) {
				if (!(errors instanceof Array)) {
					errors = [errors];
				}
				return callback(this.errorHandler.error('validation', { info: errors }));
			}
			else {
				return process.nextTick(callback);
			}
		});
	}

	// validate the input attributes ... override as needed
	validateAttributes (callback) {
		process.nextTick(callback);
	}


	// called right before we save
	preSave (callback) {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens ... note that since we're doing an update, we might not have
		// (and actually probably don't) have a complete model here
		this.model = new this.modelClass(this.attributes, { dontSetDefaults: true });
		this.model.preSave(
			(errors) => {
				if (errors) {
					if (!(errors instanceof Array)) {
						errors = [errors];
					}
					return callback(this.errorHandler.error('validation', { info: errors }));
				}
				else {
					return process.nextTick(callback);
				}
			}
		);
	}

	// check for any warnings during validation, these don't stop the document from
	// getting saved but we'll want to log them anyway
	checkValidationWarnings (callback) {
		if (
			this.model.validationWarnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validationWarnings.join('\n')}`);
		}
		process.nextTick(callback);
	}

	// do the actual update
	update (callback) {
		// do the update
		this.update = DeepClone(this.model.attributes);
		this.collection.update(
			this.update,
			(error, updatedModel) => {
				if (error) { return callback(error); }
				this.model = updatedModel;
				this.update = this.model.validator.sanitizeAttributes(this.update);
				process.nextTick(callback);
			}
		);
	}

	// override to do stuff after the document has been saved
	postSave (callback) {
		process.nextTick(callback);
	}
}

module.exports = ModelUpdater;
