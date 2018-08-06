// handle "POST /no-auth/confirm" request to confirm registration for a user

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const PasswordHasher = require('./password_hasher');
const UsernameChecker = require('./username_checker');
const UserPublisher = require('./user_publisher');
const LoginHelper = require('./login_helper');
const Errors = require('./errors');
const TeamErrors = require(process.env.CS_API_TOP + '/modules/teams/errors');
const AuthErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class ConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(TeamErrors);
		this.errorHandler.add(AuthErrors);
		this.loginType = this.loginType || 'web';
	}

	async authorize () {
		// no-auth request, authorization is through the confirmation code
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require parameters, and filter out unknown parameters
		await this.verifyToken();			// verify the confirmation token, if passed
		await this.getUser();				// get the user indicated
		await this.validateToken();			// verify the confirmation token is not expired, per the most recently issued token, if passed
		await this.checkAttributes();		// check the attributes provided in the request
		if (await this.verifyCode()) {		// verify the confirmation code is correct
			return await this.failedConfirmation();
		}
		await this.hashPassword();			// hash the provided password, if given
		await this.checkUsernameUnique();	// check that the user's username will be unique for their team, as needed
		await this.updateUser();			// update the user's database record
		await this.doLogin();				// proceed with the actual login
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				optional: {
					string: ['email', 'password', 'username', 'confirmationCode', 'token'],
					number: ['expiresIn']
				}
			}
		);
		if (!this.request.body.token && !this.request.body.confirmationCode) {
			// confirmation code or token must be provided
			throw this.errorHandler.error('parameterRequired', { info: 'confirmationCode or token' });
		}
		if (!this.request.body.token && !this.request.body.email) {
			// email or confirmation token must be provided
			throw this.errorHandler.error('parameterRequired', { info: 'email or token' });
		}
	}

	// parse and verify the passed token
	async verifyToken () {
		if (!this.request.body.token) {
			return;	// expect old-fashioned confirmation code instead
		}
		try {
			this.payload = this.api.services.tokenHandler.verify(this.request.body.token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (this.payload.type !== 'conf') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a conf token' });
		}
		if (!this.payload.uid) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no uid in payload' });
		}
	}

	// get the user associated with the email in the token payload
	async getUser () {
		if (this.payload) {
			// user ID was provided in the confirmation token, just fetch that user
			this.user = await this.data.users.getById(this.payload.uid);
			return;
		}
		const query = {
			searchableEmail: this.request.body.email.toLowerCase()
		};
		const users = await this.data.users.getByQuery(
			query,
			{
				databaseOptions: {
					hint: UserIndexes.bySearchableEmail 
				}
			}
		);
		this.user = users[0];
	}

	// verify the token is not expired, per the most recently issued token
	async validateToken () {
		if (!this.payload || !this.user) {
			return;	// no confirmation token (old-style code instead)
		}
		const accessTokens = this.user.get('accessTokens') || {};
		const confirmationTokens = accessTokens.conf || {};
		if (!confirmationTokens || !confirmationTokens.minIssuance) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no issuance for conf token found' });
		}
		if (confirmationTokens.minIssuance > this.payload.iat * 1000) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'a more recent conf token has been issued' });
		}
	}

	// check that the given attributes match the user
	async checkAttributes () {
		// can't confirm a deactivated account
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		// can't confirm an already-confirmed user
		if (this.user.get('isRegistered')) {
			throw this.errorHandler.error('alreadyRegistered');
		}
		// must provide a password for confirmation if we don't already have one
		if (!this.user.get('passwordHash') && !this.request.body.password) {
			throw this.errorHandler.error('parameterRequired', { info: 'password' });
		}
		// must provide a username for confirmation if we don't already have one
		if (!this.user.get('username') && !this.request.body.username) {
			throw this.errorHandler.error('parameterRequired', { info: 'username' });
		}
	}

	// verify the confirmation code given in the request against the one that was generated
	async verifyCode () {
		if (!this.request.body.confirmationCode) {
			// confirmation token was provided, no code check at all
			return;
		}
		// we give the user 3 attempts to enter a confirmation code, after that, they'll
		// have to get a new confirmation email sent to them
		let confirmFailed = false;
		if (this.request.body.confirmationCode !== this.user.get('confirmationCode')) {
			confirmFailed = true;
			if (this.user.get('confirmationAttempts') === MAX_CONFIRMATION_ATTEMPTS) {
				this.maxConfirmationAttempts = true;
			}
		}
		else if (Date.now() > this.user.get('confirmationCodeExpiresAt')) {
			confirmFailed = true;
			this.confirmationExpired = true;
		}
		return confirmFailed; // if true, shortcuts and prepares for failure response
	}

	// hash the given password, as needed
	async hashPassword () {
		if (!this.request.body.password) { return; }
		this.request.body.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.request.body.password
		}).hashPassword();
		delete this.request.body.password;
	}

	// check that the user's username will be unique for the team(s) they are on
	async checkUsernameUnique () {
		const username = this.request.body.username || this.user.get('username');
		if (!username) {
			return;
		}
		// we check against each team the user is on, it must be unique in all teams
		const teamIds = this.user.get('teamIds') || [];
		const usernameChecker = new UsernameChecker({
			data: this.data,
			username: username,
			userId: this.user.id,
			teamIds: teamIds
		});
		const isUnique = await usernameChecker.checkUsernameUnique();
		if (!isUnique) {
			throw this.errorHandler.error('usernameNotUnique', {
				info: {
					username: username,
					teamIds: usernameChecker.notUniqueTeamIds
				}
			});
		}
	}

	// proceed with the actual login, calling into a login helper 
	async doLogin () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user,
			loginType: this.loginType
		}).login();
	}

	// update the user in the database, indicating they are confirmed
	async updateUser () {
		await this.getFirstTeam();		// get the first team the user is on, if needed, this becomes the "origin" team
		await this.getTeamCreator();	// get the creator of that team
		await this.doUserUpdate();		// do the actual update
	}

	// get the first team the user is on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	async getFirstTeam () {
		if ((this.user.get('teamIds') || []).length === 0) {
			return;
		}
		const teamId = this.user.get('teamIds')[0];
		this.firstTeam = await this.data.teams.getById(teamId);
	}

	// get the creator of the first team the user was on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	async getTeamCreator () {
		if (!this.firstTeam) {
			return;
		}
		this.teamCreator = await this.data.users.getById(
			this.firstTeam.get('creatorId')
		);
	}

	// update the user in the database, indicating they are confirmed,
	// and add analytics data or other attributes as needed
	async doUserUpdate () {
		const now = Date.now();
		let op = {
			'$set': {
				isRegistered: true,
				modifiedAt: now,
				registeredAt: now
			},
			'$unset': {
				confirmationCode: true,
				confirmationAttempts: true,
				confirmationCodeExpiresAt: true,
				'accessTokens.conf': true
			}
		};
		if (this.passwordHash) {
			op.$set.passwordHash = this.passwordHash;
		}
		if (this.request.body.username) {
			op.$set.username = this.request.body.username;
		}
		if ((this.user.get('teamIds') || []).length > 0) {
			if (!this.user.get('joinMethod')) {
				op.$set.joinMethod = 'Added to Team';	// for tracking
			}
			if (!this.user.get('primaryReferral')) {
				op.$set.primaryReferral = 'internal';
			}
			if (
				!this.user.get('originTeamId') &&
				this.teamCreator &&
				this.teamCreator.get('originTeamId')
			) {
				op.$set.originTeamId = this.teamCreator.get('originTeamId');
			}
		}
		this.user = await this.data.users.applyOpById(this.user.id, op);
	}

	// user failed confirmation for whatever reason, we'll do a database update
	// and return the appropriate error in the response
	async failedConfirmation () {
		await this.updateUserConfirmationFailed();
		if (this.maxConfirmationAttempts) {
			throw this.errorHandler.error('tooManyConfirmAttempts');
		}
		else if (this.confirmationExpired) {
			throw this.errorHandler.error('confirmCodeExpired');
		}
		else {
			throw this.errorHandler.error('confirmCodeMismatch');
		}
	}

	// update the user's record in the database indicating a confirmation failure
	async updateUserConfirmationFailed () {
		let set = {};
		if (this.maxConfirmationAttempts || this.confirmationExpired) {
			set.confirmationCode = null;
			set.confirmationAttempts = 0;
			set.confirmationCodeExpiresAt = null;
		}
		else {
			set.confirmationAttempts = this.user.get('confirmationAttempts') + 1;
		}
		await this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(this.user.id) },
			{ $set: set }
		);
	}

	// after the request returns a response....
	async postProcess () {
		// publish the now-registered-and-confirmed user to all the team members
		await this.publishUserToTeams();
	}

	// publish the now-registered-and-confirmed user to all the team members,
	// over the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject(),
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'confirm',
			summary: 'Confirms a user\'s registration',
			access: 'No authorization needed, though the correct confirmation code or the confirmation token must be correct',
			description: 'Confirms a user\'s registration with confirmation code, or confirmation token',
			input: {
				summary: 'Specify attributes in the body; either token must be provided, or email and confirmation code must be provided',
				looksLike: {
					'email': '<User\'s email>',
					'confirmationCode': '<Confirmation code (sent via email to the user\'s email after initial registration)>',
					'token': '<Confirmation token>',
					'password': '<Can optionally set the user\'s password here>',
					'username': '<Can optionally set the user\'s username here>'
				}
			},
			returns: {
				summary: 'Returns an updated user object, plus access token and PubNub subscription key, and teams the user is on as well as repos owned by those teams',
				looksLike: {
					user: '<@@#user object#user@@>',
					accessToken: '<user\'s access token, to be used in future requests>',
					pubnubKey: '<subscribe key to use for connecting to PubNub>',
					pubnubToken: '<user\'s token for subscribing to PubNub channels>',
					teams: [
						'<@@#team object#team@@>',
						'...'
					],
					repos: [
						'<@@#repo object#repo@@>',
						'...'
					]
				}
			},
			publishes: {
				summary: 'Publishes the updated user object on the team channel for each team the user is on.',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'notFound',
				'alreadyRegistered',
				'emailMismatch',
				'usernameNotUnique',
				'tooManyConfirmAttempts',
				'confirmCodeExpired',
				'confirmCodeMismatch',
				'tokenInvalid',
				'tokenExpired'
			]
		};
	}
}

module.exports = ConfirmRequest;
