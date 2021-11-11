'use strict';

const OnlyStreamIdOkTest = require('./only_stream_id_ok_test');

class OnlyStreamIdAclTest extends OnlyStreamIdOkTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'when fetching posts in a stream and only passing the stream ID, an error should be returned if the user is not on the team that owns the stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = OnlyStreamIdAclTest;
