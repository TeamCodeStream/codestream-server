'use strict';

const GetOtherStreamTest = require('./get_other_stream_test');

class ACLTest extends GetOtherStreamTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a ${this.type} stream that i'm not a member of`;
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

module.exports = ACLTest;
