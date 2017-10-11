'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');

class Model_Creator {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'error_handler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attach_to_response = {};
	}

	create_model (attributes, callback) {
		this.collection = this.data[this.collection_name];
		if (!this.collection) {
			return callback(this.error_handler.error('internal', { reason: `collection ${this.collection_name} is not a valid collection` }));
		}

		this.attributes = attributes;
		Bound_Async.series(this, [
			this.normalize,
			this.require_attributes,
			this.validate,
			this.allow_attributes,
			this.check_existing,
			this.pre_save,
			this.check_validation_warnings,
			this.create_or_update,
			this.post_save
		], (error) => {
	 		callback(error, this.model);
		});
	}

	normalize (callback) {
		process.nextTick(callback);
	}

	require_attributes (callback) {
		let required_attributes = this.get_required_attributes() || [];
		let missing_attributes = [];
		required_attributes.forEach(attribute => {
			if (typeof this.attributes[attribute] === 'undefined') {
				missing_attributes.push(attribute);
			}
		});
		if (missing_attributes.length) {
			return callback(this.error_handler.error('attribute_required', { info: missing_attributes.join(',') }));
		}
		else {
			process.nextTick(callback);
		}
	}

	get_required_attributes () {
		return null;
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

	allow_attributes (callback) {
		process.nextTick(callback);
	}

	check_existing (callback) {
		let query = this.check_existing_query();
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
			if (this.dont_save_if_exists) {
				this.model = this.existing_model;
				return callback();
			}
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
