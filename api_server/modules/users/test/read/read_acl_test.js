'use strict';

const ReadTest = require('./read_test');

class ReadACLTest extends ReadTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return error when user attempts to mark a stream read when that user is not a member of the stream';
	}
	
	get method () {
		return 'put';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	markRead (callback) {
		this.path = '/read/' + this.stream.id,
		callback();
	}
}

module.exports = ReadACLTest;
