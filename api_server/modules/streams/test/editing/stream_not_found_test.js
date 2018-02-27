'use strict';

var EditingTest = require('./editing_test');
var ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends EditingTest {

	get description () {
		return `should return an error when trying to set editing for a stream that doesn't exist`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

    // before the test runs...
    before (callback) {
        super.before(error => {
            if (error) { return callback(error); }
			this.data.streamId = ObjectID(); // substitute an ID for a non-existent stream
            callback();
        });
    }
}

module.exports = StreamNotFoundTest;
