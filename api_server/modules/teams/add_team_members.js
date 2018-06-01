// provide a class for handling adding users to a team

'use strict';

const UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
const TeamSubscriptionGranter = require('./team_subscription_granter');
const Errors = require('./errors');

class AddTeamMembers  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.errorHandler.add(Errors);
	}

	// main function ... add the indicated members to the team
	async addTeamMembers () {
		await this.getTeam();					// get the team
		await this.getExistingMembers();		// get the team's existing members
		await this.getTeamCreator();			// get the team's creator
		await this.eliminateDuplicates();		// eliminate any duplicates (people we are asked to add who are in fact already on the team)
		await this.checkCreateUsers();			// check if we are being asked to create any users on the fly, and do so
		await this.checkUsernamesUnique();		// check that all the usernames for added users will be unique to the team
		await this.addToTeam();					// add the users to the team
		await this.updateUsers();				// update the user objects indicating they have been added to the team
		await this.grantUserMessagingPermissions();	// grant permissions for all added users to subscribe to the team channel
	}

	// get the team
	async getTeam () {
		if (this.team) { return; }	// already provided by the caller
		if (!this.teamId) {
			throw this.errorHandler.error('missingArgument', { info: 'teamId'});
		}
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
	}

	// get the users already on the team
	async getExistingMembers () {
		this.existingMembers = await this.data.users.getByIds(this.team.get('memberIds'));
	}

	// get the team's creator, which probably is but might not be
	// among the existing members
	async getTeamCreator () {
		const creatorId = this.team.get('creatorId');
		this.teamCreator = this.existingMembers.find(member => {
			return member.id === creatorId;
		});
		if (this.teamCreator) {
			return;
		}
		this.teamCreator = await this.data.users.getById(creatorId);
	}

	// eliminate any duplicates (people we are asked to add who are in fact already on the team)
	async eliminateDuplicates () {
		if (!this.users) {
			return; // no existing users to add to the team
		}
		const existingIds = this.existingMembers.map(member => member.id);
		this.usersToAdd = [];
		this.users.forEach(user => {
			if (!existingIds.includes(user.id)) {
				this.usersToAdd.push(user);
			}
		});
	}

	// if emails are provided by the caller, then we are asked to create new users on-the-fly
	// and add them to the team as we go
	async checkCreateUsers () {
		let usersToCreate = (this.emails || []).map(email => {
			return { email: email };
		});
		if (this.addUsers instanceof Array) {
			let usersToAdd = this.addUsers.filter(user => !!user.email);	// ensure no duplicates
			usersToCreate = usersToCreate.concat(usersToAdd);
		}
		this.usersCreated = [];
		this.usersFound = [];
		await Promise.all(usersToCreate.map(async user => {
			await this.createUser(user);
		}));
	}

	// create a single user who will be added to the team
	async createUser (user) {
		const existingUser = this.existingMembers.find(member => {
			return member.get('searchableEmail') === user.email.toLowerCase();	// ensure no duplicates
		});
		if (existingUser && !this.saveUserIfExists) {
			this.usersFound.push(existingUser);
			return;
		}
		this.userCreator = new UserCreator({
			request: this.request,
			dontSaveIfExists: this.saveUserIfExists ? false : true,	// if the user already exists, don't bother saving, unless overridden
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		const userCreated = await this.userCreator.createUser(user);
		if (existingUser) {
			existingUser.attributes = userCreated.attributes;
			this.usersFound.push(userCreated);
		}
		else {
			this.usersCreated.push(userCreated);
		}
	}

	// check that among all the users being added, none have usernames that will conflict with the usernames of
	// users already on the team
	async checkUsernamesUnique () {
		// the team membership will be the union of users we are asked to add, the users we created, and the
		// existing members ... for each one, check that the username is unique compared to all the others (case-insensitive)
		this.usersToAdd = [...(this.usersToAdd || []), ...(this.usersCreated || [])];
		const allUsers = [...this.usersToAdd, ...this.existingMembers];
		const usernames = [];
		let conflictingUsername = null;
		const conflict = allUsers.find(user => {
			const username = user.get('username');
			if (username) {
				const usernameLowercase = username.toLowerCase();
				if (usernames.includes(usernameLowercase)) {
					conflictingUsername = username;
					return true;
				}
				usernames.push(usernameLowercase);
			}
		});
		if (conflict) {
			throw this.errorHandler.error('usernameNotUnique', { info: conflictingUsername });
		}
	}

	// add users to the team by adding IDs to the memberIds array
	async addToTeam () {
		const ids = this.usersToAdd.map(user => user.id);
		await this.data.teams.applyOpById(
			this.team.id,
			{ '$addToSet': { memberIds: ids } }
		);
	}

	// update the users who were added, indicating that they are on a new team
	async updateUsers () {
		this.membersAdded = [];
		await Promise.all(this.usersToAdd.map(async user => {
			await this.updateUser(user);
		}));
	}

	// update a user who was added, indicating they are now on a team
	async updateUser (user) {
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
			if (this.teamCreator && this.teamCreator.get('originTeamId')) {
				op.$set.originTeamId = this.teamCreator.get('originTeamId');
			}
		}
		const updatedUser = await this.data.users.applyOpById(user.id, op);
		this.membersAdded.push(updatedUser);
	}

	// grant permission to the new members to subscribe to the team channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.team,
			members: this.usersToAdd,
			request: this.request
		};
		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}
}

module.exports = AddTeamMembers;
