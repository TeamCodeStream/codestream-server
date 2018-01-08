'use strict';

var GetStreamTest = require('./get_stream_test');

class ACLTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return `should return an error when trying to fetch a ${this.type} stream from a team that i\'m not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		this.path = '/streams/' + this.stream._id;
		callback();
	}
}

module.exports = ACLTest;
