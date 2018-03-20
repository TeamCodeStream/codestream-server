'use strict';

var PutMarkerTest = require('./put_marker_test');

class ACLTest extends PutMarkerTest {

    constructor (options) {
		super(options);
		this.withoutOtherUserOnTeam = true;
	}

	get description () {
        return 'should return an error when someone who is not on the team tries to update a marker';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// replace the current user's token with the other user's token
			this.token = this.otherUserData.accessToken;
			callback();
		});
	}
}

module.exports = ACLTest;
