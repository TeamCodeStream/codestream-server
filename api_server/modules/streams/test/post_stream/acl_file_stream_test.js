'use strict';

const PostFileStreamTest = require('./post_file_stream_test');

class ACLFileStreamTest extends PostFileStreamTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.teamOptions, {
				creatorIndex: 1,
				members: [2]
			});
			this.repoOptions.creatorIndex = 1;
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

module.exports = ACLFileStreamTest;
