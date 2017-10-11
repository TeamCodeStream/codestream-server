'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Deep_Clone = require(process.env.CI_API_TOP + '/lib/util/deep_clone');

class Data_Model_Validator {

	constructor (attribute_definitions = {}) {
		this.attribute_definitions = attribute_definitions;
		this.set_required_attributes();
		this.set_validation_functions();
	}

	set_required_attributes () {
		this.required_attributes = [];
		let attribute_definitions = Object.keys(this.attribute_definitions);
		attribute_definitions.forEach(attribute => {
			if (this.attribute_definitions[attribute].required) {
				this.required_attributes.push(attribute);
			}
		});
	}

	set_validation_functions () {
		this.validation_functions = {
			timestamp: this.validate_timestamp.bind(this),
			number: this.validate_number.bind(this),
			boolean: this.validate_boolean.bind(this),
			string: this.validate_string.bind(this),
			object: this.validate_object.bind(this),
			array: this.validate_array.bind(this)
		};
	}

	validate (attributes = {}, callback = null, options = {}) {
		this.attributes = attributes;
		this.options = options;
		this.existing_attributes = Object.keys(this.attributes);
		Bound_Async.series(this, [
			this.check_required,
			this.validate_attributes
		], () => {
			let errors = this.errors && this.errors.length ? this.errors : null;
			return callback && callback(errors, this.warnings);
		});
	}

	check_required (callback) {
		if (!this.options.new) {
			return process.nextTick(callback);
		}
		let missing_attributes = [];
		this.required_attributes.forEach(required_attribute => {
			if (this.existing_attributes.indexOf(required_attribute) === -1) {
				missing_attributes.push(required_attribute);
			}
		});
		if (missing_attributes.length) {
			this.errors = ['these required attributes are missing: ' + missing_attributes.join(',')];
		}
		process.nextTick(callback);
	}

	validate_attributes (callback) {
		Bound_Async.forEachLimit(
			this,
			Object.keys(this.attributes),
			10,
			this.validate_attribute,
			callback
		);
	}

	validate_attribute (attribute, callback) {
		const attribute_definition = this.attribute_definitions[attribute];
		if (!attribute_definition) {
			if (!this.attribute_definitions.$free_form_ok) {
				this.warnings = this.warnings || [];
				this.warnings.push(`Deleting attribute ${attribute}, attribute not found in attribute definitions`);
				delete this.attributes[attribute];
			}
			return process.nextTick(callback);
		}

		const type = attribute_definition.type;
		let validation_function = this.validation_functions[type];
		if (typeof validation_function !== 'function') {
			this.warnings = this.warnings || [];
			this.warnings.push(`Deleting attribute ${attribute}, type ${type} is not recognized`);
			delete this.attributes[attribute];
			return process.nextTick(callback);
		}

		if (typeof this.attributes[attribute] !== 'undefined') {
			let validation_result = validation_function(this.attributes[attribute], attribute_definition);
			if (validation_result) {
				this.errors = this.errors || [];
				this.errors.push({ [attribute]: validation_result });
			}
		}

		process.nextTick(callback);
	}

	validate_timestamp (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'timestamp must be a number';
		}
	}

	validate_number (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'must be a number';
		}
	}

	validate_boolean (value/*, definition*/) {
		if (value !== true && value !== false) {
			return 'must be a boolean';
		}
	}

	validate_string (value, definition) {
		if (typeof value !== 'string') {
			return 'must be a string';
		}
		if (
			definition &&
			definition.max_length &&
			value.length > definition.max_length
		) {
			return `string length must be less than or equal to ${definition.max_length} characters`;
		}
		if (
			definition &&
			definition.min_length &&
			value.length < definition.min_length
		) {
			return `string length must be greater than or equal to ${definition.min_length} characters`;
		}
	}

	validate_object (value, definition) {
		if (typeof value !== 'object') {
			return 'must be an object';
		}
		if (
			definition &&
			definition.max_size &&
			JSON.stringify(value).length > definition.max_size
		) {
			return 'object is too big';
		}
	}

	validate_array (value, definition) {
		if (!(value instanceof Array)) {
			return 'must be an array';
		}
		if (
			definition &&
			definition.max_length &&
			value.length > definition.max_length
		) {
			return 'too many elements in array';
		}
		if (
			definition &&
			definition.max_size &&
			JSON.stringify(value).length > definition.max_size
		) {
			return 'array is too big';
		}
	}

	sanitize_attributes (object) {
		Object.keys(this.attribute_definitions).forEach(attribute => {
			if (this.attribute_definitions[attribute].server_only) {
				delete object[attribute];
			}
		});
		return object;
	}

	sanitize_model (model) {
		this.sanitize_attributes(model.attributes);
		return model;
	}

	get_sanitized_object (model) {
		let object = Deep_Clone(model.attributes);
		return this.sanitize_attributes(object);
	}
}

module.exports = Data_Model_Validator;
