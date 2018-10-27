// provides the Marker model for handling markers
// note that we don't derive from the standard CodeStreamModel here,
// so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const MarkerAttributes = require('./marker_attributes');

class Marker extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(MarkerAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all IDs are lowercase
		this.lowerCase('teamId');
		this.lowerCase('streamId');
		this.lowerCase('postId');
		this.lowerCase('commitHashWhenCreated');
		await super.preSave(options);
	}
}

module.exports = Marker;
