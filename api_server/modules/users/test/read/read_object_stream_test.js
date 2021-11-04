'use strict';

const ReadTest = require('./read_test');

class ReadObjectStreamTest extends ReadTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			wantCodeError: true,
			claimCodeErrors: true
		});
	}
	
	get description () {
		return 'should clear lastReads for the specified object stream ID for the current user ';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/read/' + this.postData[0].codeError.streamId;
			callback();
		});
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.user.$unset = {
				[`lastReads.${this.postData[0].codeError.streamId}`]: true,
			}
			callback();
		});
	}
}

module.exports = ReadObjectStreamTest;
