'use strict';

const PutStreamTest = require('./put_stream_test');

class ACLTest extends PutStreamTest {

	get description () {
		return 'should return an error when trying to update a stream the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only members can update this stream'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.members = [2];
			callback();
		});
	}
}

module.exports = ACLTest;
