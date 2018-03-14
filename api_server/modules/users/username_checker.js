// handle checking that a user's username will be unique across all teams they
// are a member of

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Indexes = require('./indexes');

class UsernameChecker  {

	constructor (options) {
		Object.assign(this, options);
		this.username = this.username.toLowerCase();
	}

	// check that the user's (proposed) username will be unique across all teams
	// they are a member of
	checkUsernameUnique (callback) {
		BoundAsync.series(this, [
			this.getUsers,					// get all users on the teams (just usernames)
			this.arrangeUsernamesByTeam,	// arrange the usernames according to the team (for error reporting if there is a conflict)
			this.checkUniqueness			// check for the uniqueness of the username across all teams
		], (error) => {
			callback(error, this.isUnique);
		});
	}

	// get the users across all teams the user is a member of
	getUsers (callback) {
		let query = {
			teamIds: this.data.users.inQuery(this.teamIds)
		};
		this.data.users.getByQuery(
			query,
			(error, users) => {
				if (error) { return callback(error); }
				this.users = users;
				callback();
			},
			{
				databaseOptions: {
					fields: ['username', 'teamIds'],	// only fetch these fields, to minimize database output size
					hint: Indexes.byTeamIds
				},
				noCache: true
			}
		);
	}

	// arrange all the fetched usernames according to team
	// (since we fetched them all in a lump operation)
	arrangeUsernamesByTeam (callback) {
		this.usernamesByTeam = {};
		BoundAsync.forEach(
			this,
			this.users,
			this.arrangeUsernameByTeam,
			callback
		);
	}

	// arrange the username for a given user according to the team
	// the user belongs to
	arrangeUsernameByTeam (user, callback) {
		// we're not concerned about the user matching its own username,
		// nor are we concerned about deactivated users
		if (
			(this.userId && user._id === this.userId) ||
			!user.username ||
			user.deactivated
		) {
			return callback();
		}
		// for each team this user is a member of, put its username in with that team
		user.teamIds.forEach(teamId => {
			this.usernamesByTeam[teamId] = this.usernamesByTeam[teamId] || [];
			this.usernamesByTeam[teamId].push(user.username.toLowerCase());
		});
		process.nextTick(callback);
	}

	// check the proposed username against all the usernames in each team
	checkUniqueness (callback) {
		this.notUniqueTeamIds = [];
		Object.keys(this.usernamesByTeam).forEach(teamId => {
			if (this.usernamesByTeam[teamId].indexOf(this.username) !== -1) {
				this.notUniqueTeamIds.push(teamId);
			}
		});
		this.isUnique = this.notUniqueTeamIds.length === 0;
		process.nextTick(callback);
	}
}

module.exports = UsernameChecker;
