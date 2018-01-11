// provides an abstract base class to handle the update of a document in the database...
// a standard flow of operations is provided here, but heavy derivation can be done to
// tweak this process ... this isn't really implemented or used yet ... much is still TODO

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ModelUpdater {

	constructor (options) {
		Object.assign(this, options);
	}

	// update the model
	updateModel (attributes, callback, options) {
		if (!this.collection) {
			return callback(this.errorHandler.error('internal', { reason: 'can not update model without a collection' }));
		}
		if (!this.model && !this.object) {
			return callback(this.errorHandler.error('internal', { reason: 'can not update model without a model or object' }));
		}
		if (!this.model) {
			this.model = new this.modelClass(this.object);
		}
		this.attributes = attributes;
		this.options = options;
		BoundAsync.series(this, [
			this.preSave,	// any stuff to do before we save (like validation)?
			this.save		// do the actual save
		], (error) => {
			if (error && typeof error === 'object' && error.validations) {
				return callback(this.errorHandler.error('validation', { info: error.validations }));
			}
			else {
				return callback(error, this.model);
			}
		});
	}

	// called right before we save
	preSave (callback) {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens
		this.model = new this.model(this.attributes);
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
			},
			this.options
		);
	}

	// do the actual save
	save (callback) {
		this.collection.update(
			this.model.attributes,
			callback,
			this.options
		);
	}
}

module.exports = ModelUpdater;
