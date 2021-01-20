// handles the creation of one or more user being invited to a team, with allowances for existing 
// unregistered and unregistered users matching the email of the user being invited

'use strict';

const UserCreator = require('./user_creator');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const AddTeamPublisher = require('./add_team_publisher');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

const REINVITE_INTERVAL = 24 * 60 * 60 * 1000;
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
		const userCreator = new UserCreator({
			request: this.request,
			teamIds: [this.team.id],
			subscriptionCheat: this.subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			userBeingAddedToTeamId: this.team.id,
			inviteCodeExpiresIn: this.inviteCodeExpiresIn,
			inviteInfo: this.inviteInfo,
			inviteType: this.inviteType
		});
		const createdUser = await userCreator.createUser(userData);
		const didExist = !!userCreator.existingModel;
		const wasOnTeam = userCreator.existingModel && userCreator.existingModel.hasTeam(this.team.id);
		this.invitedUsers.push({
			user: createdUser,
			wasOnTeam,
			didExist,
			inviteCode: userCreator.inviteCode
		});
	}

	// add the created users to the team indicated
	async addUsersToTeam () {
		await new AddTeamMembers({
			request: this.request,
			addUsers: this.invitedUsers.map(userData => userData.user),
			team: this.team,
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		}).addTeamMembers();

		// refetch the users since they changed when added to team
		await Promise.all(this.invitedUsers.map(async userData => {
			userData.user = await this.data.users.getById(userData.user.id);
		}));
	}

	// track the number of users the inviting user has invited
	async setNumInvited () {
		const numInvited = this.invitedUsers.reduce((total, userData) => {
			if (!userData.wasOnTeam) {
				total++;
			}
			return total;
		}, 0);
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
			this.publishNumUsersInvited
		], this);
	}

	// publish to the team that the users have been added,
	// and publish to each user that they've been added to the team
	async publishAddToTeam () {
		// get the team again since the team object has been modified,
		// this should just fetch from the cache, not from the database
		const team = await this.data.teams.getById(this.team.id);
		await new AddTeamPublisher({
			request: this.request,
			broadcaster: this.api.services.broadcaster,
			users: this.invitedUsers.map(userData => userData.user),
			team: team,
			teamUpdate: this.transforms.teamUpdate,
			userUpdates: this.transforms.userUpdates
		}).publishAddedUsers();
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
		const { user, wasOnTeam, didExist } = userData;
		// don't send an email if invited user is already registered and already on a team
		if (user.get('isRegistered') && wasOnTeam) {
			return;
		}

		// queue invite email for send by outbound email service
		this.request.log(`Triggering invite email to ${user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'invite',
				userId: user.id,
				inviterId: this.user.id,
				teamName: this.team.get('name'),
				isReinvite: didExist
			},
			{
				request: this.request,
				user
			}
		);

		// This is disabled since SQS doesn't support long enough message delays,
		//  but since it might be applicable for on-prem with RabbitMQ, I'm leaving the code in place
		/*
		// for unregistered users, queue resending the invite every given interval until they accept, or we reach 
		// a maximum number of invites
		if (!user.get('isRegistered')) {
			for (let i = 0; i < REINVITE_REPEATS; i++) {
				const reinviteTime = REINVITE_INTERVAL * (i+1);
				this.request.log(`Triggering reinvite in ${reinviteTime} ms...`);
				await this.api.services.email.queueReinvite(
					{
						userId: user.id,
						inviterId: this.user.id,
						teamName: this.team.get('name'),
						isReinvite: didExist
					},
					{
						request: this.request,
						user,
						delay: reinviteTime
					}
				);
			}
		}
		*/
	}

	// for an unregistered user, we track that they've been invited
	// and how many times for analytics purposes
	async updateInvites (userData) {
		const { user, didExist } = userData;
		if (user.get('isRegistered')) {
			return;	// we only do this for unregistered users
		}
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
		if (!didExist) {
			Object.assign(update.$set, {
				needsAutoReinvites: 2,
				autoReinviteInfo: {
					inviterId: this.user.id,
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
}

module.exports = UserInviter;
