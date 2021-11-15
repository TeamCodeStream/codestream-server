'use strict';

const GetStreamTest = require('./get_stream_test');

class ACLTeamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: []
		});
	}

	get description () {
		return `should return an error when trying to fetch a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTeamTest;
