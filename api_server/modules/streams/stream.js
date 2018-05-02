// provides the Stream model for handling streams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const StreamValidator = require('./stream_validator');

class Stream extends CodeStreamModel {

	getValidator () {
		return new StreamValidator();
	}

	setDefaults () {
		this.attributes.privacy = 'public';	// streams are public unless explicitly set otherwise
		super.setDefaults();
	}

	// right before the stream is saved...
	async preSave (options = {}) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('memberIds');
		this.lowerCase('teamId');
		this.lowerCase('repoId');

		// ensure the array of member IDs is sorted
		if (this.attributes.memberIds instanceof Array) {
			this.attributes.memberIds.sort();
		}

		// files always have public privacy,
		// direct streams always have private
		if (this.type === 'file') {
			this.privacy = 'public';
		}
		else if (this.type === 'direct') {
			this.privacy = 'private';
		}
		else if (options.new && this.type === 'channel' && !this.privacy) {
			this.privacy = 'public';
		}

		await super.preSave(options);
	}
}

module.exports = Stream;
