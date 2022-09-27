// handles the creation of one or more user being invited to a team, with allowances for existing 
// unregistered and unregistered users matching the email of the user being invited

'use strict';

const UserCreator = require('./user_creator');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const Indexes = require('./indexes');

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
		if (
			existingUser &&
			(existingUser.get('teamIds') || []).length === 0
		) {
			// special case of a match to an existing user that isn't on any teams
			// in this case, we feed the user's attributes into the user we create, but don't actually
			// use that existing user record
			[
				'fullName',
				'timeZone',
				'username',
				'_pubnubUuid',
				'joinMethod',
				'preferences',
				'avatar',
				'originTeamId',
				'passwordHash'
			].forEach(attribute => {
				const value = existingUser.get(attribute);
				if (value !== undefined) {
					userData[attribute] = value;
				}
			});
			existingUser = undefined;
		}
		const userCreator = new UserCreator({
			request: this.request,
			existingUser,
			team: this.team,
			user: this.user,
			inviteType: !this.dontSendEmail && this.inviteType
		});
		const createdUser = await userCreator.createUser(userData);
		this.invitedUsers.push({
			user: createdUser,
			didExist: !!existingUser
		});
	}

	// get the existing user matching this email, if any
	async getExistingUser (userData) {
		// if the user has already been invited, seek them out,
		// or if there is a user who is on no teams, use that to feed user data,
		// but we will still create a new record
		const matchingUsers = await this.data.users.getByQuery(
			{ searchableEmail: userData.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
		return matchingUsers.find(user => {
			if (user.get('deactivated')) { 
				return false;
			}
			const teamIds = (user.get('teamIds') || []);
			return (
				teamIds.length === 0 ||
				(
					teamIds.length === 1 &&
					teamIds[0] === this.team.id
				)
			);
		});
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
			this.publishNumUsersInvited
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
		const { user, didExist } = userData;

		// queue invite email for send by outbound email service
		this.request.log(`Triggering invite email to ${user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'invite',
				userId: user.id,
				inviterId: this.user.id,
				teamId: this.team.id,
				teamName: this.team.get('name'),
				isReinvite: didExist
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
		const { user, didExist } = userData;
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
}

module.exports = UserInviter;
