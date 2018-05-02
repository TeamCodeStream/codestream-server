'use strict';

const PutStreamTest = require('./put_stream_test');

class ACLTest extends PutStreamTest {

	constructor (options) {
		super(options);
		this.withoutUserInStream = true;
	}

	get description () {
		return 'should return an error when trying to update a stream the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only members can update this stream'
		};
	}
}

module.exports = ACLTest;
