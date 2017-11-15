'use strict';

var DataModelValidator = require('./data_model_validator');
var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');

class DataModel {

	constructor (attributes) {
		this.attributes = {};
		this.setDefaults();
		Object.assign(this.attributes, DeepClone(attributes || {}));
		this.id = this.attributes._id;
		this.validator = this.getValidator();
	}

	getValidator () {
		return new DataModelValidator();
	}

	setDefaults (/*attributes*/) { }

	preSave (callback, options) {
		this.validate(callback, this.attributes, options);
	}

	validate (callback, attributes, options) {
		attributes = attributes || this.attributes;
		this.validator.validate(
			attributes,
			(errors, warnings) => {
				this.handleValidation(errors, warnings, options, callback);
			},
			options
		);
	}

	handleValidation (errors, warnings, options, callback) {
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
			this.validationWarnings = warnings;
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

	getSanitizedObject () {
		return this.validator.getSanitizedObject(this);
	}

	sanitize () {
		return this.validator.sanitizeModel(this);
	}
}

module.exports = DataModel;
