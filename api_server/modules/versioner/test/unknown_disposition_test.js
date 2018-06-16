'use strict';

const VersionerTest = require('./versioner_test');

class UnknownDispositionTest extends VersionerTest {

    constructor (options) {
        super(options);
        this.expectedDisposition = 'unknown';
    }

    get description () {
        return 'should set X-CS-Version-Disposition to "unknown" when no plugin IDE is sent with the request';
    }

    // before the test runs...
    before (callback) {
        // remove the X-CS-Plugin-IDE header from the request
        super.before(error => {
            if (error) { return callback(error); }
            delete this.apiRequestOptions.headers['x-cs-plugin-ide'];
            callback();
        });
    }

	// validate the version headers returned with the response to the test request
	validateVersionHeaders () {
        // we don't expect any version headers
    }

	// validate the version headers concerning the agent that are returned with the response
	// to the test request
	validateAgentHeaders () {
        // we don't expect any version headers concerning the agent
    }
}

module.exports = UnknownDispositionTest;