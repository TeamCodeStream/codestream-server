// base class for many tests of the "PUT /teams" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUsers,	// create a few registered users
			this.createRandomTeam,	// create a random team for the test
			this.addOtherUsers,     // add the other users to the team
			this.makeAdmins,		// make other users into admins, as needed
			this.makeTeamData		// make the data to be used during the update
		], callback);
	}

	// create a few other registered users (in addition to the "current" user)
	createOtherUsers (callback) {
		this.otherUserData = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createOtherUser,
			callback
		);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (n, callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData.push(response);
				callback();
			}
		);
	}

	// create a random team to use for the test
	createRandomTeam (callback) {
		let token = this.withoutOtherUserOnTeam ? this.token : this.otherUserData[0].accessToken;
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

	// add the other users to the team created (the "other" user created it)
	addOtherUsers (callback) {
		let users = [];
		if (!this.currentUserNotOnTeam) {
			users.push(this.currentUser);
		}
		if (!this.dontAddOtherUsers) {
			users.push(...this.otherUserData.map(data => data.user).slice(1));
		}
		BoundAsync.forEachSeries(
			this,
			users,
			this.addOtherUser,
			callback
		);
	}

	// add another user to the team created
	addOtherUser (user, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team._id,
					email: user.email
				},
				token: this.otherUserData[0].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.team.memberIds.push(user._id);
				callback();
			}
		);
	}

	// make other users into admins for the team, if desired for the test
	makeAdmins (callback) {
		const adminIds = [];
		if (!this.dontMakeCurrentUserAdmin) {
			adminIds.push(this.currentUser._id);
		}
		if (this.whichAdmins) {
			for (let i = 0; i < this.whichAdmins.length; i++) {
				adminIds.push(this.otherUserData[this.whichAdmins[i]].user._id);
			}
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: { $push: { adminIds } },
				token: this.otherUserData[0].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.team.adminIds.push(...adminIds);
				callback();
			}
		);
	}

	// form the data for the team update
	makeTeamData (callback) {
		this.data = {
			name: this.teamFactory.randomName()
		};
		this.expectedTeam = Object.assign({}, this.team, this.data);
		this.path = '/teams/' + this.team._id;
		this.modifiedAfter = Date.now();
		callback();
	}
}

module.exports = CommonInit;
