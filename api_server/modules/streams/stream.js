// provides the Stream model for handling streams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const StreamValidator = require('./stream_validator');

class Stream extends CodeStreamModel {

	getValidator () {
		return new StreamValidator();
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

		// make sure we have an appropriate privacy attribute
		this.setDefaultPrivacy(options);

		await super.preSave(options);
	}

	// make sure we have an appropriate privacy attribute
	setDefaultPrivacy (options) {
		// files always have public privacy,
		// direct streams always have private,
		// channels default to private but can be public
		if (this.attributes.type === 'file') {
			this.attributes.privacy = 'public';
		}
		else if (this.attributes.type === 'direct') {
			this.attributes.privacy = 'private';
		}
		else if (
			options.new &&
			this.attributes.type === 'channel' &&
			!this.attributes.privacy
		) {
			if (this.attributes.isTeamStream) {
				this.attributes.privacy = 'public';
			}
			else {
				this.attributes.privacy = 'private';
			}
		}
	}
}

module.exports = Stream;
