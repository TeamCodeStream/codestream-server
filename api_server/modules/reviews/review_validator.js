// provide a validator for review attributes

'use strict';

const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const ReviewAttributes = require('./review_attributes');

class ReviewValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, ReviewAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}
}

module.exports = ReviewValidator;
