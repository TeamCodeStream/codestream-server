'use strict';

const VersionerTest = require('./versioner_test');

class UnknownVersionTest extends VersionerTest {

    constructor (options) {
        super(options);
        this.expectedDisposition = 'unknownVersion';
    }

    get description () {
        return 'should set X-CS-Version-Disposition to "unknownVersion" when an unknown plugin version is sent with the request';
    }

    // before the test runs...
    before (callback) {
        // set the X-CS-Plugin-Version header to something unknown
        super.before(error => {
            if (error) { return callback(error); }
            this.apiRequestOptions.headers['x-cs-plugin-version'] = this.UNKNOWN_RELEASE;
            callback();
        });
    }

	// validate the version headers concerning the agent that are returned with the response
	// to the test request
	validateAgentHeaders () {
        // we don't expect any version headers concerning the agent
    }
}

module.exports = UnknownVersionTest;