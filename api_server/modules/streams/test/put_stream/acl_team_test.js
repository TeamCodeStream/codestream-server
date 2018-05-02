'use strict';

const PutStreamTest = require('./put_stream_test');

class ACLTeamTest extends PutStreamTest {

	constructor (options) {
		super(options);
		this.withoutUserOnTeam = true;
		this.isTeamStream = true;
	}

	get description () {
		return 'should return an error when someone who is not on the team tries to update a stream in that team';
	}
    
	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only members can update this stream'
		};
	}
}

module.exports = ACLTeamTest;
