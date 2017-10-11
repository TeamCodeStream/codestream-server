'use strict';

var Data_Model_Validator = require('./data_model_validator');

class Data_Model {

	constructor (attributes) {
		this.attributes = {};
		this.set_defaults();
		Object.assign(this.attributes, attributes || {});
		this.id = this.attributes._id;
		this.validator = this.get_validator();
	}

	get_validator () {
		return new Data_Model_Validator();
	}

	set_defaults (/*attributes*/) { }

	pre_save (callback, options) {
		this.validate(callback, this.attributes, options);
	}

	validate (callback, attributes, options) {
		attributes = attributes || this.attributes;
		this.validator.validate(
			attributes,
			(errors, warnings) => {
				this.handle_validation(errors, warnings, options, callback);
			},
			options
		);
	}

	handle_validation (errors, warnings, options, callback) {
		if (errors) {
			if (!(errors instanceof Array)) {
				errors = [errors];
			}
			return callback(errors);
		}
		if (warnings) {
			if (!(warnings instanceof Array)) {
				warnings = [warnings];
			}
			this.validation_warnings = warnings;
		}
		process.nextTick(callback);
	}

	get (attribute) {
		return this.attributes[attribute];
	}

	set (attribute, value) {
		let attributes = {};
		if (typeof attribute === 'string') {
			attributes[attribute] = value;
		}
		else if (typeof attribute === 'object') {
			attributes = attribute;
		}
		Object.assign(this.attributes, attributes);
	}

	get_sanitized_object () {
		return this.validator.get_sanitized_object(this);
	}

	sanitize () {
		return this.validator.sanitize_model(this);
	}
}

module.exports = Data_Model;
