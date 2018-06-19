// base class for many tests of the "PUT /teams" requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
            this.createRandomTeam,	// create a random team for the test
            this.addCurrentUser,    // add the current user to the team
			this.makeTeamData		// make the data to be used during the update
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random team to use for the test
	createRandomTeam (callback) {
		let token = this.withoutOtherUserOnTeam ? this.token : this.otherUserData.accessToken;
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: token	// the "other user" is the team creator, unless otherwise specified
			}
		);
	}

    // add the current user to the team created (the "other" user created it)
    addCurrentUser (callback) {
        if (this.currentUserNotOnTeam) {
            return callback();
        }
        this.doApiRequest(
            {
                method: 'post',
                path: '/users',
                data: {
                    teamId: this.team._id,
                    email: this.currentUser.email
                },
                token: this.otherUserData.accessToken
			},
			callback
        );
    }

	// form the data for the team update
	makeTeamData (callback) {
		this.data = {
			name: this.teamFactory.randomName()
		};
		this.expectedTeam = Object.assign({}, this.team, this.data);
		this.expectedTeam.memberIds.push(this.currentUser._id);
		this.path = '/teams/' + this.team._id;
		this.modifiedAfter = Date.now();
		callback();
	}
}

module.exports = CommonInit;
