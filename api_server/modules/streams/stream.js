// provides the Stream model for handling streams

'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var StreamValidator = require('./stream_validator');

class Stream extends CodeStreamModel {

	getValidator () {
		return new StreamValidator();
	}

	// right before the stream is saved...
	preSave (callback, options) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('memberIds');
		this.lowerCase('teamId');
		this.lowerCase('repoId');

		// ensure the array of member IDs is sorted
		if (this.attributes.memberIds instanceof Array) {
			this.attributes.memberIds.sort();
		}
		super.preSave(callback, options);
	}
}

module.exports = Stream;
