'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Model_Updater {

	constructor (options) {
		Object.assign(this, options);
	}

	update_model (attributes, callback, options) {
		if (!this.collection) {
			return callback(this.error_handler.error('internal', { reason: 'can not update model without a collection' }));
		}
		if (!this.model && !this.object) {
			return callback(this.error_handler.error('internal', { reason: 'can not update model without a model or object' }));
		}
		if (!this.model) {
			this.model = new this.model_class(this.object);
		}
		this.attributes = attributes;
		this.options = options;
		Bound_Async.series(this, [
			this.pre_save,
			this.save
		], (error) => {
			if (error && typeof error === 'object' && error.validations) {
				return callback(this.error_handler.error('validation', { info: error.validations }));
			}
			else {
				return callback(error, this.model);
			}
		});
	}

	pre_save (callback) {
		this.model = new this.model(this.attributes);
		this.model.pre_save(
			(errors) => {
				if (errors) {
					if (!(errors instanceof Array)) {
						errors = [errors];
					}
					return callback(this.error_handler.error('validation', { info: errors }));
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

module.exports = Model_Updater;
