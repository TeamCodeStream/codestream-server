// Provides an abstract base class to use for models that should be part of a DataCollection
// Doesn't have much practical use unless derived from

'use strict';

const DataModelValidator = require('./data_model_validator');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class DataModel {

	constructor (attributes, options = {}) {
		this.validator = this.getValidator();	// validator engine
		this.attributes = {};
		if (!options.dontSetDefaults) {
			this.setDefaults();	// set defaults, and _then_ apply the attributes as given (which might overwrite defaults)
		}
		Object.assign(this.attributes, DeepClone(attributes || {}));	// make a deep copy of all attributes
		this.id = this.attributes.id;	// establish an ID field for convenience
	}

	// get the validator engine to use to validate attributes
	// override to provide a validator engine with additional validator functions
	getValidator () {
		return new DataModelValidator();
	}

	// set default attributes
	setDefaults () { 
		this.validator.setDefaults(this);
	}

	// called right before the model is saved
	async preSave (options) {
		// validate myself
		await this.validate(this.attributes, options);
	}

	// validate this model or a set of attributes passed in
	async validate (attributes, options) {
		attributes = attributes || this.attributes;
		// pass this on to the validator engine, which does the dirty work
		const info = await this.validator.validate(attributes, options);
		await this.handleValidation(info, options);
	}

	// handle the response from a validation call
	async handleValidation (info/*, options*/) {
		let { error, warnings } = info;
		// for errors, these generate an error up the chain
		if (error) {
			throw error;
		}
		// for warnings, we'll be quiet about it, but the caller should probably log them,
		// or do SOMETHING anyway ... cause warnings are important, right?
		if (warnings) {
			if (!(warnings instanceof Array)) {
				warnings = [warnings];
			}
			this.validationWarnings = warnings;
		}
	}

	// getter for an attribute
	get (attribute) {
		return this.attributes[attribute];
	}

	// setter for an attribute, can either set a single value or several values passed as an object
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

	// get a sanitized version of this model, as an object ... with attributes not to be served to clients
	getSanitizedObject () {
		return this.validator.getSanitizedObject(this);
	}

	// sanitize this model, removing all attributes that should not be served to clients
	sanitize () {
		return this.validator.sanitizeModel(this);
	}
}

module.exports = DataModel;
