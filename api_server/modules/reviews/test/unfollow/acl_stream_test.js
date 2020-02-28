'use strict';

const UnfollowTest = require('./unfollow_test');

class ACLStreamTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.streamOptions.members = [2];
		this.skipFollow = true;
	}

	get description () {
		return `should return an error when trying to unfollow a review posted to a ${this.streamType} stream the current user is not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLStreamTest;
