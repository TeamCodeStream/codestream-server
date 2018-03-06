'use strict';

var SlackPostTest = require('./slack_post_test');
var ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request with a stream ID that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.streamId = ObjectID();	// generate random stream ID
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
