'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');
var Assert = require('assert');

class DirectStreamIgnoresPrivacyTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid stream and ignore the privacy attribute when creating a direct stream';
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a direct stream...
		super.before(error => {
            if (error) { return callback(error); }
            // ...and add a "public" privacy setting, which should be ignored
            this.data.privacy = 'public';
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
        // we should still see that privacy is private
		let stream = data.stream;
		Assert(stream.privacy === 'private', 'privacy should be private');
		super.validateResponse(data);
	}
}

module.exports = DirectStreamIgnoresPrivacyTest;
