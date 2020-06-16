// provides the Review model for handling code reviews

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const ReviewAttributes = require('./review_attributes');
const ReviewValidator = require('./review_validator');

class Review extends CodeStreamModel {

	getValidator () {
		return new ReviewValidator(ReviewAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all native IDs are lowercase
		this.lowerCase('teamId');
		this.lowerCaseNativeId('streamId');
		this.lowerCaseNativeId('postId');
		this.lowerCase('codemarkIds');
		await super.preSave(options);
	}
}

module.exports = Review;
