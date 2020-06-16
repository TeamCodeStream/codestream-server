'use strict';

const RejectTest = require('./reject_test');

class ACLStreamTest extends RejectTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.streamOptions.members = [2];
	}

	get description () {
		return `should return an error when trying to reject a review posted to a ${this.streamType} stream the current user is not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLStreamTest;
