// base class for many tests of the "PUT /users" requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.makeUserData		// make the data to be used during the update
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

	// create a random repo to use for the test
	createRandomRepo (callback) {
        let withEmails = this.withoutOtherUserOnTeam ? [] : [this.currentUser.email];
        let token = this.withoutOtherUserOnTeam ? this.token : this.otherUserData.accessToken;
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: withEmails,	// include current user, unless we're not including the other user, in which case the current user is the repo creator
				withRandomEmails: 1,	// another user for good measure
				token: token	// the "other user" is the repo and team creator, unless otherwise specified
			}
		);
	}

	// form the data for the post update
	makeUserData (callback) {
		this.data = {};
		this.attributes.forEach(attribute => {
			this.data[attribute] = RandomString.generate(10);
		});
        this.path = '/users/' + (this.id || this.currentUser._id);
        this.modifiedAfter = Date.now();
        callback();
	}
}

module.exports = CommonInit;
