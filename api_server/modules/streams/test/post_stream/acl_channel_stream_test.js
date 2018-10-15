'use strict';

const PostChannelStreamTest = require('./post_channel_stream_test');

class ACLChannelStreamTest extends PostChannelStreamTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.teamOptions, {
				creatorIndex: 1,
				members: [2]
			});
			callback();
		});
	}

	get description () {
		return `should return an error when trying to create a ${this.type} stream in a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLChannelStreamTest;
