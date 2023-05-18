// handles the creation of one or more user being invited to a team, with allowances for existing 
// unregistered and unregistered users matching the email of the user being invited

'use strict';

const UserCreator = require('./user_creator');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const Indexes = require('./indexes');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const UserAttributes = require('./user_attributes');
const EligibleJoinCompaniesPublisher = require('./eligible_join_companies_publisher');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const ObjectId = require('mongodb').ObjectId;

const REINVITE_REPEATS = 2;

class UserInviter {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
	}

	async inviteUsers (userData) {
		this.userData = userData;
		await this.getTeam();
		await this.createUsers();
		await this.addUsersToTeam();
		await this.setNumInvited();
		return this.invitedUsers;
	}

	// get the team the user will belong to
	async getTeam () {
		this.team = this.team || await this.data.teams.getById(this.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// create the users as needed, though some may already exists, which requires special treatment
	async createUsers () {
		this.invitedUsers = [];
		await Promise.all(this.userData.map(async userData => {
			await this.createUser(userData);
		}));
	}

	// create the user as needed, though the user may already exist, which requires special treatment
	async createUser (userData) {
		// first check for an existing user
		// we use the existing user record only if it is on the team already
		let existingUser = await this.getExistingUser(userData);
		let wasOnTeam = (
			existingUser &&
			existingUser.hasTeam(this.team.id)
		);
		let wasRegisteredOnTeam = (
			wasOnTeam &&
			existingUser.get('isRegistered')
		);
		let isReinvite = !!existingUser;
		if (
			existingUser &&
			!(existingUser.get('teamIds') || []).includes(this.team.id)
		) {
			userData.copiedFromUserId = existingUser.id;
			const attributesToCopy = Object.keys(UserAttributes).filter(attr => {
				return UserAttributes[attr].copyOnInvite;
			});

			// if we found a user that matches by email, but isn't actually on the team, we create
			// a new user record, and feed the user's attributes from the existing user
			attributesToCopy.forEach(attribute => {
				const value = existingUser.get(attribute);
				if (value !== undefined) {
					userData[attribute] = value;
				}
			});
			existingUser = undefined;

			// don't duplicate providerInfo data specific to a team, we identity these by checking if
			// we can create a legitimate mongo ID out of the key
			if (userData.providerInfo) {
				userData.providerInfo = DeepClone(userData.providerInfo);
				Object.keys(userData.providerInfo).forEach(key => {
					try { 
						ObjectId(key); 
						delete userData.providerInfo[key];
					} catch (e) {
					}
				});
			}
		}
		const userCreator = new UserCreator({
			request: this.request,
			existingUser,
			team: this.team,
			user: this.user,
			inviteType: (!this.dontSendEmail && this.inviteType)
		});
		const createdUser = await userCreator.createUser(userData);
		this.invitedUsers.push({
			user: createdUser,
			isReinvite,
			wasOnTeam,
			wasRegisteredOnTeam
		});
	}

	// add the created users to the team indicated
	async addUsersToTeam () {
		await new AddTeamMembers({
			request: this.request,
			addUsers: this.invitedUsers.map(userData => userData.user),
			team: this.team
		}).addTeamMembers();

		// refetch the users since they changed when added to team
		await Promise.all(this.invitedUsers.map(async userData => {
			userData.user = await this.data.users.getById(userData.user.id);
		}));
	}

	// get the existing user matching this email, if any
	async getExistingUser (userData) {
		const matchingUsers = await this.data.users.getByQuery(
			{ searchableEmail: userData.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);

		// preferentially return a user previously invited to this team,
		// or a teamless user, or a user on another team
		// for the latter, we feed the user data, but we will still create a new record
		let teamlessUser, userOnOtherTeam;
		const userOnTeam = matchingUsers.find(user => {
			if (user.get('deactivated')) { 
				return false;
			}
			const teamIds = (user.get('teamIds') || []);
			if (teamIds.length === 0) {
				teamlessUser = user;
			} else if (teamIds.length === 1 && teamIds[0] === this.team.id) {
				return user;
			} else {
				userOnOtherTeam = user;
			}
		});
		return userOnTeam || teamlessUser || userOnOtherTeam;
	}

	// track the number of users the inviting user has invited
	async setNumInvited () {
		const numInvited = this.invitedUsers.length;
		if (numInvited === 0) { return; }
		const op = {
			$set: {
				numUsersInvited: (this.user.get('numUsersInvited') || 0) + numInvited,
				modifiedAt: Date.now()
			}
		};
		this.transforms.invitingUserUpdateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// after the response to the calling request has been sent, perform additional operations
	async postProcess () {
		await awaitParallel([
			this.publishAddToTeam,
			this.sendInviteEmails,
			this.publishNumUsersInvited,
			this.publishEligibleJoinCompanies
		], this);
	}

	// publish to the team that the users have been added,
	// and publish to each user that they've been added to the team
	async publishAddToTeam () {
		const channel = `team-${this.team.id}`;
		const sanitizedUsers = this.invitedUsers.map(userData => userData.user.getSanitizedObject({ request: this.request }));
		const message = {
			requestId: this.request.request.id,
			users: sanitizedUsers,
			team: this.transforms.teamUpdate,
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish user added message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

	// send invite emails to the added users
	async sendInviteEmails () {
		if (this.delayEmail) {	// allow client to delay the email sends, for testing purposes
			setTimeout(this.sendInviteEmails.bind(this), this.delayEmail);
			delete this.delayEmail;
			return;
		}

		await Promise.all(this.invitedUsers.map(async userData => {
			// using both of these flags is kind of perverse, but i don't want to affect existing behavior ...
			// dontSendEmail is set on the POST /users request, and the expectation is that the invites information won't
			// be updated either ... that behavior came first and i want to leave it alone
			// but on the other hand when users are created on the fly in a review or codemark,
			// we don't want to send invite emails but we DO want to update the invite info
			if (!this.dontSendEmail && !this.dontSendInviteEmail) {
				await this.sendInviteEmail(userData);
			}
			if (!this.dontSendEmail) {
				await this.updateInvites(userData);
			}
		}));
	}

	// send an invite email to the given user
	async sendInviteEmail (userData) {
		const { user, isReinvite, wasRegisteredOnTeam} = userData;

		// don't send an email if invited user is already registered and already on a team
		if (wasRegisteredOnTeam) {
			return;
		}

		// queue invite email for send by outbound email service
		this.request.log(`Triggering invite email to ${user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'invite',
				userId: user.id,
				inviterId: this.user.id,
				teamId: this.team.id,
				teamName: this.team.get('name'),
				isReinvite
			},
			{
				request: this.request,
				user
			}
		);
	}

	// for an unregistered user, we track that they've been invited
	// and how many times for analytics purposes
	async updateInvites (userData) {
		const { user, isReinvite } = userData;
		const update = {
			$set: {
				internalMethod: 'invitation',
				internalMethodDetail: this.user.id,
				lastInviteSentAt: Date.now(),
			},
			$inc: {
				numInvites: 1
			}
		};

		// only trigger a re-invite cycle if this is a brand new user
		if (!isReinvite) {
			Object.assign(update.$set, {
				needsAutoReinvites: REINVITE_REPEATS,
				autoReinviteInfo: {
					inviterId: this.user.id,
					teamId: this.team.id,
					teamName: this.team.get('name'),
					isReinvite: true
				}
			});
		}

		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(user.id) },
			update
		);
	}

	// if inviting user has numUsersInvited incremented, publish it
	async publishNumUsersInvited () {
		if (this.dontPublishToInviter) { return; }
		if (!this.transforms.invitingUserUpdateOp) { return; }
		const channel = 'user-' + this.user.id;
		const message = {
			user: this.transforms.invitingUserUpdateOp,
			requestId: this.request.request.id
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.request.warn(`Unable to publish inviting user update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// publish to all registered users the resulting change in eligibleJoinCompanies
	async publishEligibleJoinCompanies () {
		return Promise.all(this.invitedUsers.map(async user => {
			await new EligibleJoinCompaniesPublisher({
				request: this.request,
				broadcaster: this.request.api.services.broadcaster
			}).publishEligibleJoinCompanies(user.user.get('email'))
		}));
	}
}

module.exports = UserInviter;
