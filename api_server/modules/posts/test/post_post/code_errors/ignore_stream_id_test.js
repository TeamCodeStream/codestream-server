'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class IgnoreStreamIdTest extends CodeErrorTest {

	get description () {
		return 'when creating a code error, streamId should be ignored (unlike other posts)';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.data.streamId = this.teamStream.id;
			callback();
		});
	}

	validateResponse (data) {
		Assert.notEqual(data.codeError.streamId, this.teamStream.id, 'streamId set to team stream ID');
		super.validateResponse(data);
	}
}

module.exports = IgnoreStreamIdTest;
