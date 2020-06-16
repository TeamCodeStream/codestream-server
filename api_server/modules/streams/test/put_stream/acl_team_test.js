'use strict';

const PutStreamTest = require('./put_stream_test');

class ACLTeamTest extends PutStreamTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to update a stream in that team';
	}
    
	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only members can update this stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.teamOptions, {
				creatorIndex: 1,
				members: [2]
			});
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
