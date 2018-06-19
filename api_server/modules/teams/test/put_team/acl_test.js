'use strict';

var PutTeamTest = require('./put_team_test');

class ACLTest extends PutTeamTest {

    constructor (options) {
        super(options);
        this.currentUserNotOnTeam = true;
    }

	get description () {
		return 'should return an error when trying to update a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
