'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ModelUpdater {

	constructor (options) {
		Object.assign(this, options);
	}

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
			this.preSave,
			this.save
		], (error) => {
			if (error && typeof error === 'object' && error.validations) {
				return callback(this.errorHandler.error('validation', { info: error.validations }));
			}
			else {
				return callback(error, this.model);
			}
		});
	}

	preSave (callback) {
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

	save (callback) {
		this.collection.update(
			this.model.attributes,
			callback,
			this.options
		);
	}
}

module.exports = ModelUpdater;
