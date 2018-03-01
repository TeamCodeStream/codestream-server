'use strict';

var EditingTest = require('./editing_test');
var ObjectID = require('mongodb').ObjectID;
var Assert = require('assert');

class StreamNotFoundTest extends EditingTest {

	get description () {
		return `should return an empty response when trying to set editing for a stream that doesn't exist`;
	}

    // before the test runs...
    before (callback) {
        super.before(error => {
            if (error) { return callback(error); }
			this.data.streamId = ObjectID(); // substitute an ID for a non-existent stream
            callback();
        });
    }

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}
}

module.exports = StreamNotFoundTest;
