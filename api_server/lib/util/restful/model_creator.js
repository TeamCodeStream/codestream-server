'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');

class Model_Creator {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'error_handler', 'user'].forEach(x => this[x] = this.request[x]);
	}

	create_model (attributes, callback) {
		this.collection = this.data[this.collection_name];
		if (!this.collection) {
			return callback(this.error_handler.error('internal', { reason: `collection ${this.collection_name} is not a valid collection` }));
		}

		this.attributes = attributes;
		Bound_Async.series(this, [
			this.allow_attributes,
			this.validate,
			this.check_existing,
			this.pre_save,
			this.check_validation_warnings,
			this.create_or_update,
			this.post_save
		], (error) => {
	 		callback(error, this.model);
		});
	}

	allow_attributes (callback) {
		process.nextTick(callback);
	}

	validate (callback) {
		this.validate_attributes((errors) => {
			if (errors) {
				if (!(errors instanceof Array)) {
					errors = [errors];
				}
				return callback(this.error_handler.error('validation', { info: errors }));
			}
			else {
				return process.nextTick(callback);
			}
		});
	}

	validate_attributes (callback) {
		process.nextTick(callback);
	}

	check_required (required_attributes) {
		var missing_attribute = required_attributes.find(attribute => {
			return (typeof this.attributes[attribute] === 'undefined');
		});
		if (missing_attribute) {
			return { [missing_attribute]: 'is required' };
		}
	}

	check_existing (callback) {
		var query = this.check_existing_query();
		if (!query) {
			return process.nextTick(callback);
		}
		this.collection.get_one_by_query(
			query,
			(error, model) => {
				if (error) { return callback(error); }
				if (model) {
					if (!this.model_can_exist(model)) {
						return callback(this.error_handler.error('exists'));
					}
					this.existing_model = model;
				}
				return process.nextTick(callback);
			}
		);
	}

	check_existing_query () {
		return null;
	}

	model_can_exist (/*model*/) {
		return false;
	}

	pre_save (callback) {
		if (this.existing_model) {
			this.attributes = Object.assign({}, this.existing_model.attributes, this.attributes);
		}
		this.model = new this.model_class(this.attributes);
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
			{
				new: !this.existing_model
			}
		);
	}

	check_validation_warnings (callback) {
		if (
			this.model.validation_warnings instanceof Array &&
			this.api
		) {
			this.api.warn(`Validation warnings: \n${this.model.validation_warnings.join('\n')}`);
		}
		process.nextTick(callback);
	}

	create_or_update (callback) {
		if (this.existing_model) {
			this.update(callback);
		}
		else {
			this.create(callback);
		}
	}

	update (callback) {
		if (this.dont_save_if_exists) {
			this.model = this.existing_model;
			return process.nextTick(callback);
		}
		this.collection.update(
			this.model.attributes,
			(error, updated_model) => {
				if (error) { return callback(error); }
				this.model = updated_model;
				this.did_exist = true;
				process.nextTick(callback);
			}
		);
	}

	create (callback) {
		this.collection.create(
			this.model.attributes,
			(error, created_model) => {
				if (error) { return callback(error); }
				this.model = created_model;
				process.nextTick(callback);
			}
		);
	}

	post_save (callback) {
		process.nextTick(callback);
	}
}

module.exports = Model_Creator;
