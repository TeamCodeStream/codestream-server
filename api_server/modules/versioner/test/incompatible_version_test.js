'use strict';

const VersionerTest = require('./versioner_test');

class IncompatibleVersionTest extends VersionerTest {

    constructor (options) {
        super(options);
        this.expectedDisposition = 'incompatible';
        this.pluginVersion = this.INCOMPATIBLE_RELEASE;
    }

    get description () {
        return 'should return an error and set X-CS-Version-Disposition to "incompatible" when an expired version of the IDE plugin is indicated with the request';
    }

    getExpectedError () {
        return {
            code: 'VERS-1001'
        };
    }

    // run the actual test...
    run (callback) {
        // even though we're expecting an error, we'll still validate the returned headers
        super.run(error => {
            if (error) { return callback(error); }
            this.validateResponse();
            callback();
        })
    }
}

module.exports = IncompatibleVersionTest;