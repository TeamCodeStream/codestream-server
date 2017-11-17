'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var UserCreator = require(process.env.CS_API_TOP + '/services/api/modules/users/user_creator');
var TeamSubscriptionGranter = require('./team_subscription_granter');
const Errors = require('./errors');

class AddTeamMembers  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.errorHandler.add(Errors);
	}

	addTeamMembers (callback) {
		BoundAsync.series(this, [
			this.getTeam,
			this.getMembers,
			this.eliminateDuplicates,
			this.checkCreateUsers,
			this.checkUsernamesUnique,
			this.addToTeam,
			this.updateUsers,
			this.grantUserMessagingPermissions
		], callback);
	}

	getTeam (callback) {
		if (this.team) { return callback(); }
		if (!this.teamId) {
			return callback(this.errorHandler.error('missingArgument', { info: 'teamId'}));
		}
		this.data.teams.getById(
			this.teamId,
			(error, team) => {
				if (error) { return callback(error); }
				if (!team) {
					return callback(this.errorHandler.error('notFound', { info: 'team'}));
				}
				this.team = team;
				callback();
			}
		);
	}

	getMembers (callback) {
		this.data.users.getByIds(
			this.team.get('memberIds'),
			(error, members) => {
				if (error) { return callback(error); }
				this.existingMembers = members;
				callback();
			}
		);
	}

	eliminateDuplicates (callback) {
		if (!this.users) {
			return callback();
		}
		let existingIds = this.existingMembers.map(member => member.id);
		let nonDuplicateUsers = [];
		this.users.forEach(user => {
			if (existingIds.indexOf(user.id) === -1) {
				nonDuplicateUsers.push(user);
			}
		});
		this.users = nonDuplicateUsers;
		process.nextTick(callback);
	}

	checkCreateUsers (callback) {
		if (
			!(this.emails instanceof Array) ||
			this.emails.length === 0
		) {
			return callback();
		}
		this.usersCreated = [];
		BoundAsync.forEachSeries(
			this,
			this.emails,
			this.createUser,
			callback
		);
	}

	createUser (email, callback) {
		if (this.existingMembers.find(member => {
			return member.get('searchableEmail') === email.toLowerCase();
		})) {
			return callback();
		}
		this.userCreator = new UserCreator({
			request: this.request,
			dontSaveIfExists: true
		});
		this.userCreator.createUser(
			{
				email: email
			},
			(error, user) => {
				if (error) { return callback(error); }
				this.usersCreated.push(user);
				process.nextTick(callback);
			}
		);
	}

	checkUsernamesUnique (callback) {
		this.usersToAdd = [...(this.users || []), ...(this.usersCreated || [])];
		let allUsers = [...this.usersToAdd, ...this.existingMembers];
		let usernames = [];
		let conflictingUsername = null;
		let conflict = allUsers.find(user => {
			let username = user.get('username');
			if (username) {
				let usernameLowercase = username.toLowerCase();
				if (usernames.indexOf(usernameLowercase) !== -1) {
					conflictingUsername = username;
					return true;
				}
				usernames.push(usernameLowercase);
			}
		});
		if (conflict) {
			return callback(this.errorHandler.error('usernameNotUnique', { info: conflictingUsername }));
		}
		else {
			return process.nextTick(callback);
		}
	}

	addToTeam (callback) {
		let ids = this.usersToAdd.map(user => user.id);
		this.data.teams.applyOpById(
			this.team.id,
			{ '$addToSet': { memberIds: ids } },
			callback
		);
	}

	updateUsers (callback) {
		this.updatedUsers = [];
		this.sanitizedUsers = [];
		BoundAsync.forEach(
			this,
			this.usersToAdd,
			this.updateUser,
			callback
		);
	}

	updateUser (user, callback) {
		this.data.users.applyOpById(
			user.id,
			{
				'$addToSet': {
					companyIds: this.team.get('companyId'),
					teamIds: this.team.id
				}
			},
			(error, updatedUser) => {
				if (error) { return callback(error); }
				this.updatedUsers.push(updatedUser);
				this.sanitizedUsers.push(updatedUser.getSanitizedObject());
				callback();
			}
		);
	}

	grantUserMessagingPermissions (callback) {
		new TeamSubscriptionGranter({
			data: this.data,
			messager: this.api.services.messager,
			team: this.team,
			members: this.usersToAdd
		}).grantToMembers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}
}

module.exports = AddTeamMembers;
