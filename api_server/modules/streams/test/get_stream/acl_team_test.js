'use strict';

const GetOtherStreamTest = require('./get_other_stream_test');

class ACLTeamTest extends GetOtherStreamTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: []
		});
		Object.assign(this.streamOptions, {
			creatorIndex: 1,
			members: []
		});
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return `should return an error when trying to fetch a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use when making the test request
	setPath (callback) {
		this.path = '/streams/' + this.stream.id;
		callback();
	}
}

module.exports = ACLTeamTest;
