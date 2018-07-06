// handle checking that a user's username will be unique across all teams they
// are a member of

'use strict';

const Indexes = require('./indexes');

class UsernameChecker  {

	constructor (options) {
		Object.assign(this, options);
	}

	// check that the user's (proposed) username will be unique across all teams
	// they are a member of
	async checkUsernameUnique () {
		if (this.username.toLowerCase() === 'codestream' && !this.resolveTillUnique) {
			// don't allow 'codestream' at all, this is "reserved"
			return false;
		}
		this.teamIds = this.teamIds || [];
		if (this.teamIds.length === 0) {
			// no conflict if the user is not on any teams
			return true;
		}

		await this.getUsers();					// get all users on the teams (just usernames)
		await this.arrangeUsernamesByTeam();	// arrange the usernames according to the team (for error reporting if there is a conflict)
		if (this.resolveTillUnique) {
			// instead of reporting a conflict, resolve the conflict by adding an increment numeral until there is no conflict
			await this.resolveUniqueness();	
		}
		else {
			// check for the uniqueness of the username across all teams
			await this.checkUniqueness();
		}
		return this.isUnique;
	}

	// get the users across all teams the user is a member of
	async getUsers () {
		if (this.users) {
			return;	// already have the users
		}
		const query = {
			teamIds: this.data.users.inQuery(this.teamIds)
		};
		this.users = await this.data.users.getByQuery(
			query,
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
	async arrangeUsernamesByTeam () {
		this.usernamesByTeam = {};
		await Promise.all(this.users.map(async user => {
			await this.arrangeUsernameByTeam(user);
		}));
	}

	// arrange the username for a given user according to the team
	// the user belongs to
	async arrangeUsernameByTeam (user) {
		// we're not concerned about the user matching its own username,
		// nor are we concerned about deactivated users
		if (
			(this.userId && user._id === this.userId) ||
			!user.username ||
			user.deactivated
		) {
			return;
		}
		// for each team this user is a member of, put its username in with that team
		(user.teamIds || []).forEach(teamId => {
			this.usernamesByTeam[teamId] = this.usernamesByTeam[teamId] || [];
			this.usernamesByTeam[teamId].push(user.username.toLowerCase());
		});
	}

	// check the proposed username against all the usernames in each team
	async checkUniqueness () {
		this.notUniqueTeamIds = [];
		Object.keys(this.usernamesByTeam).forEach(teamId => {
			if (this.usernamesByTeam[teamId].includes(this.username.toLowerCase())) {
				this.notUniqueTeamIds.push(teamId);
			}
		});
		this.isUnique = this.notUniqueTeamIds.length === 0;
	}

	// resolve a uniqueness conflict by adding a numeral to the username until it is unique
	async resolveUniqueness () {
		// loop until we find a free username
		this.isUnique = false;
		const baseUsername = this.username;
		for (let i = 0; i < 1000 && !this.isUnique; i++) {	// try up to 100 just for sanity
			if (i > 0) {
				this.username = `${baseUsername}${i}`;
			}
			await this.checkUniqueness();
		}
	}
}

module.exports = UsernameChecker;
