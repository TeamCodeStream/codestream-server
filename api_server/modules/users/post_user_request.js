// handle the 'POST /users' request, to create (invite) a user (or fetch if user
// with same email already exists)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');
const AddTeamPublisher = require('./add_team_publisher');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class PostUserRequest extends PostRequest {

	async authorize () {
		// must be on the team to invite a user to it!
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });
	}

	// process the request...
	async process () {
		// totally pre-empt the restful creation of a model out of the box ... instead
		// what we're doing here is adding them to a team, and that flow will actually
		// create the user as needed
		await this.requireAndAllow();
		await this.addToTeam();
		await this.formResponse();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		this.delayEmail = this.request.body._delayEmail; // delay sending the invite email, for testing
		delete this.request.body._delayEmail;
		this.subscriptionCheat = this.request.body._subscriptionCheat; // cheat code for testing only, allow subscription to me-channel before confirmation
		delete this.request.body._subscriptionCheat;
		// backward compatibility with first/last name, turn it into a full name
		if (!this.request.body.fullName && (this.request.body.firstName || this.request.body.lastName)) {
			this.request.body.fullName = `${this.request.body.firstName || ''} ${this.request.body.lastName || ''}`.trim();
			delete this.request.body.firstName;
			delete this.request.body.lastName;
		}
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'email']
				},
				optional: {
					string: ['fullName'],
					boolean: ['dontSendEmail']
				}
			}
		);
	}

	// add the passed user to the team indicated, this will create the user as needed
	async addToTeam () {
		const user = Object.assign({}, this.request.body);
		delete user.teamId;
		delete user.dontSendEmail;
		this.adder = new AddTeamMembers({
			request: this,
			addUsers: [user],
			teamId: this.request.body.teamId.toLowerCase(),
			subscriptionCheat: this.subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			saveUserIfExists: true	// override provided attributes of the user as needed
		});
		await this.adder.addTeamMembers();
	}

	// after the response has been sent...
	async postProcess () {
		await awaitParallel([
			this.publishAddToTeam,
			this.sendInviteEmail,
			this.trackInvite,
			this.updateInvites,
		], this);
	}

	// publish to the team that the user has been added,
	// and publish to the user that they've been added to the team
	async publishAddToTeam () {
		await new AddTeamPublisher({
			request: this,
			messager: this.api.services.messager,
			user: this.createdUser,
			team: this.adder.team,
			existingMembers: this.adder.existingMembers,
		}).publishAddedUser();
	}

	// send an invite email to the added user
	async sendInviteEmail () {
		if (this.request.body.dontSendEmail || this.dontSendEmail) {
			return; // don't send email if this flag is set
		}
		if (this.delayEmail) {	// allow client to delay the email send, for testing purposes
			setTimeout(this.sendInviteEmail.bind(this), this.delayEmail);
			delete this.delayEmail;
			return;
		}
		await this.api.services.email.sendInviteEmail(
			{
				inviter: this.user,
				user: this.createdUser,
				team: this.adder.team,
				request: this
			}
		);
	}

	// track this invite for analytics
	async trackInvite () {
		if (this.request.body.dontSendEmail || this.dontSendEmail) {
			return; // don't track invite email if we're not sending an email
		}
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return;
		}

		const company = await this.data.companies.getById(this.adder.team.get('companyId'));
		const trackObject = {
			'distinct_id': this.user.id,
			'Email Address': this.user.get('email'),
			'Invitee Email Address': this.createdUser.get('email'),
			'First Invite': !this.createdUser.get('numInvites'),
			'Registered': !!this.createdUser.get('isRegistered'),
			'Join Method': this.user.get('joinMethod'),
			'Team ID': this.adder.team.id,
			'Team Size': this.adder.team.get('memberIds').length,
			'Company': company.get('name'),
			'Endpoint': this.request.headers['x-cs-plugin-ide'] || 'Unknown IDE',
			'Plugin Version': this.request.headers['x-cs-plugin-version'] || '',
			'Plan': 'Free' // FIXME: update when we have payments
		};
		if (this.user.get('registeredAt')) {
			trackObject['Date Signed Up'] = new Date(this.user.get('registeredAt')).toISOString();
		}
		if (this.user.get('lastPostCreatedAt')) {
			trackObject['Date of Last Post'] = new Date(this.user.get('lastPostCreatedAt')).toISOString();
		}

		this.api.services.analytics.track(
			'Team Member Invited',
			trackObject,
			{
				request: this,
				user: this.user
			}
		);
	}

	// for an unregistered user, we track that they've been invited
	// and how many times for analytics purposes
	async updateInvites () {
		if (this.request.body.dontSendEmail) {
			return; // don't update invites if this flag is set
		}
		if (this.createdUser.get('isRegistered')) {
			return;	// we only do this for unregistered users
		}
		const update = {
			$set: {
				internalMethod: 'invitation',
				internalMethodDetail: this.user.id
			},
			$inc: {
				numInvites: 1
			}
		};
		await this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(this.createdUser.id) },
			update
		);
	}

	// form the response to the request
	async formResponse () {
		if (this.adder.membersAdded && this.adder.membersAdded.length > 0) {
			this.createdUser = this.adder.membersAdded[0];
		}
		else if (this.adder.usersFound && this.adder.usersFound.length > 0) {
			this.createdUser = this.adder.usersFound[0];
			if (this.createdUser.get('isRegistered')) {
				this.dontSendEmail = true;	// don't send invite email to registered user already on the team
			}
		}
		else {
			// shouldn't really happen
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		this.responseData = { user: this.createdUser.getSanitizedObject() };
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a user with the given email, or finds the existing user with that email, and puts that user on the team specified. Also sends the user an invite email, unless the dontSendEmail flag is set.';
		description.access = 'Current user must be a member of the team they are putting the created or found user on';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team onto which the user should be put>',
				'email*': '<Email of the user to be created or found>',
				'fullName': '<Full name of the user, this is only set if the user is created>',
				'dontSendEmail': '<If set to true, an invite email will not be sent to the user>'
			}
		};
		description.returns.summary = 'The user object for the created or found user';
		Object.assign(description.returns.looksLike, {
			user: '<@@#user object#user@@>'
		});
		description.publishes = {
			summary: 'The user object will be published on the team channel for the team that the user was added to.',
			looksLike: {
				user: '<@@#user object#user@@>'
			}
		};
		description.errors.push('usernameNotUnique');
		return description;
	}
}

module.exports = PostUserRequest;
