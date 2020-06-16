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
		const { type, title, text, markerIds } = attributes;
		
		// markers are required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_MARKERS.includes(type) &&
			(
				!(markerIds instanceof Array) ||
				markerIds < 1
			)
		) {
			info.error = `${type} codemarks require markers`;
		}

		// text is required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_TEXT.includes(type) &&
			!text
		) {
			info.error = `${type} codemarks require text`;
		}

		// title is required for these types
		if (
			CodemarkTypes.TYPES_REQUIRING_TITLE.includes(type) &&
			!title
		) {
			info.error = `${type} codemarks require title`;
		}

		// these types are invisible and should have neither text nor title
		if (
			CodemarkTypes.INVISIBLE_TYPES.includes(type) &&
			(title || text)
		) {
			info.error = `${type} codemarks cannot have title or text`;
		}
		return info;
	}
}

module.exports = CodemarkValidator;
