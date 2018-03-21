// provide a class for handling adding users to a team

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
var TeamSubscriptionGranter = require('./team_subscription_granter');
const Errors = require('./errors');

class AddTeamMembers  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.errorHandler.add(Errors);
	}

	// main function ... add the indicated members to the team
	addTeamMembers (callback) {
		BoundAsync.series(this, [
			this.getTeam,					// get the team
			this.getExistingMembers,		// get the team's existing members
			this.eliminateDuplicates,		// eliminate any duplicates (people we are asked to add who are in fact already on the team)
			this.checkCreateUsers,			// check if we are being asked to create any users on the fly, and do so
			this.checkUsernamesUnique,		// check that all the usernames for added users will be unique to the team
			this.addToTeam,					// add the users to the team
			this.updateUsers,				// update the user objects indicating they have been added to the team
			this.grantUserMessagingPermissions	// grant permissions for all added users to subscribe to the team channel
		], callback);
	}

	// get the team
	getTeam (callback) {
		if (this.team) { return callback(); }	// already provided by the caller
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

	// get the users already on the team
	getExistingMembers (callback) {
		this.data.users.getByIds(
			this.team.get('memberIds'),
			(error, members) => {
				if (error) { return callback(error); }
				this.existingMembers = members;
				callback();
			}
		);
	}

	// eliminate any duplicates (people we are asked to add who are in fact already on the team)
	eliminateDuplicates (callback) {
		if (!this.users) {
			return callback(); // no existing users to add to the team
		}
		let existingIds = this.existingMembers.map(member => member.id);
		this.usersToAdd = [];
		this.users.forEach(user => {
			if (existingIds.indexOf(user.id) === -1) {
				this.usersToAdd.push(user);
			}
		});
		process.nextTick(callback);
	}

	// if emails are provided by the caller, then we are asked to create new users on-the-fly
	// and add them to the team as we go
	checkCreateUsers (callback) {
		let usersToCreate = (this.emails || []).map(email => {
			return { email: email };
		});
		if (this.addUsers instanceof Array) {
			let usersToAdd = this.addUsers.filter(user => !!user.email);	// ensure no duplicates
			usersToCreate = usersToCreate.concat(usersToAdd);
		}
		this.usersCreated = [];
		BoundAsync.forEachSeries(
			this,
			usersToCreate,
			this.createUser,
			callback
		);
	}

	// create a single user who will be added to the team
	createUser (user, callback) {
		if (this.existingMembers.find(member => {
			return member.get('searchableEmail') === user.email.toLowerCase();	// ensure no duplicates
		})) {
			return callback();
		}
		this.userCreator = new UserCreator({
			request: this.request,
			dontSaveIfExists: true,	// if the user already exists, don't bother saving
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		this.userCreator.createUser(
			user,
			(error, userCreated) => {
				if (error) { return callback(error); }
				this.usersCreated.push(userCreated);
				process.nextTick(callback);
			}
		);
	}

	// check that among all the users being added, none have usernames that will conflict with the usernames of
	// users already on the team
	checkUsernamesUnique (callback) {
		// the team membership will be the union of users we are asked to add, the users we created, and the
		// existing members ... for each one, check that the username is unique compared to all the others (case-insensitive)
		this.usersToAdd = [...(this.usersToAdd || []), ...(this.usersCreated || [])];
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

	// add users to the team by adding IDs to the memberIds array
	addToTeam (callback) {
		let ids = this.usersToAdd.map(user => user.id);
		this.data.teams.applyOpById(
			this.team.id,
			{ '$addToSet': { memberIds: ids } },
			callback
		);
	}

	// update the users who were added, indicating that they are on a new team
	updateUsers (callback) {
		this.membersAdded = [];
		BoundAsync.forEach(
			this,
			this.usersToAdd,
			this.updateUser,
			callback
		);
	}

	// update a user who was added, indicating they are now on a team
	updateUser (user, callback) {
		let op = {
			'$addToSet': {
				companyIds: this.team.get('companyId'),
				teamIds: this.team.id
			}
		};
		// handle the rare case where a registered user isn't on a team yet,
		// and therefore they don't yet have a joinMethod ... we'll update
		// the joinMethod to "Added to Team" here
		if (
			user.get('isRegistered') &&
			this.user &&
			user.id !== this.user.id && 	// the current user will get Joined Team later
			(
				(user.get('teamIds') || []).length === 0 ||
				!user.get('joinMethod')
			)
		) {
			op.$set = {
				joinMethod: 'Added to Team',
				primaryReferral: 'internal'
			};
		}
		this.data.users.applyOpById(
			user.id,
			op,
			(error, updatedUser) => {
				if (error) { return callback(error); }
				this.membersAdded.push(updatedUser);
				callback();
			}
		);
	}

	// grant permission to the new members to subscribe to the team channel
	grantUserMessagingPermissions (callback) {
		let granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.team,
			members: this.usersToAdd,
			request: this.request
		};
		new TeamSubscriptionGranter(granterOptions).grantToMembers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}
}

module.exports = AddTeamMembers;
