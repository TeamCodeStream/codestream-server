// provide a validator for codemark attributes

'use strict';

const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const CodemarkAttributes = require('./codemark_attributes');
const CodemarkTypes = require('./codemark_types');

class CodemarkValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, CodemarkAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}

	setValidationFunctions () {
		super.setValidationFunctions();
		Object.assign(this.validationFunctions, {
			codemarkType: this.validateCodemarkType.bind(this)
		});
	}

	// validate that the stream type is one of the accepted types
	validateCodemarkType (value/*, definition, options*/) {
		if (!CodemarkTypes.TYPES.includes(value.toLowerCase())) {
			return `invalid codemark type: ${value}`;
		}
	}

	// validate a set of attributes
	async validate (attributes = {}, options = {}) {
		const info = await super.validate(attributes, options);
		if (info.error) {
			return info;
		}

		// markers are required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_MARKERS.includes(attributes.type) &&
			(
				!(attributes.markerIds instanceof Array) ||
				attributes.markerIds < 1
			)
		) {
			info.error = `${attributes.type} codemarks require markers`;
		}

		// text is required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_TEXT.includes(attributes.type) &&
			!attributes.text
		) {
			info.error = `${attributes.type} codemarks require text`;
		}

		// title is required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_TITLE.includes(attributes.type) &&
			!attributes.title
		) {
			info.error = `${attributes.type} codemarks require title`;
		}
		return info;
	}
}

module.exports = CodemarkValidator;
