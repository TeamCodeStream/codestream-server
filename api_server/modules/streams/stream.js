// provides the Stream model for handling streams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const StreamValidator = require('./stream_validator');

class Stream extends CodeStreamModel {

	getValidator () {
		return new StreamValidator();
	}

	// right before the stream is saved...
	async preSave (options) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('memberIds');
		this.lowerCase('teamId');
		this.lowerCase('repoId');

		// ensure the array of member IDs is sorted
		if (this.attributes.memberIds instanceof Array) {
			this.attributes.memberIds.sort();
		}
		await super.preSave(options);
	}
}

module.exports = Stream;
