// handle "POST /no-auth/confirm" request to confirm registration for a user

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const Tokenizer = require('./tokenizer');
const PasswordHasher = require('./password_hasher');
const UsernameChecker = require('./username_checker');
const UserSubscriptionGranter = require('./user_subscription_granter');
const UserPublisher = require('./user_publisher');
const InitialDataFetcher = require('./initial_data_fetcher');
const TeamErrors = require(process.env.CS_API_TOP + '/modules/teams/errors');
const Errors = require('./errors');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class ConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(TeamErrors);
	}

	async authorize () {
		// no-auth request, authorization is through the confirmation code
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require parameters, and filter out unknown parameters
		await this.getUser();				// get the user indicated
		await this.checkAttributes();		// check the attributes provided in the request
		if (await this.verifyCode()) {		// verify the confirmation code is correct
			return await this.failedConfirmation();
		}
		await this.hashPassword();			// hash the provided password, if given
		await this.checkUsernameUnique();	// check that the user's username will be unique for their team, as needed
		await this.generateToken();			// generate an access token for the user
		await this.updateUser();			// update the user's database record
		await this.grantSubscriptionPermissions();	// grant subscription permissions for the user to receive messages
		await this.getInitialData();		// get the "initial data" to return in the request response
		await this.formResponse();		// form the request response to send back to the client
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'confirmationCode']
				},
				optional: {
					string: ['userId', 'password', 'username']
				}
			}
		);
	}

	// get the user, as given by the userId
	async getUser () {
		if (this.request.body.userId) {
			const userId = this.request.body.userId.toLowerCase();
			this.user = await this.data.users.getById(userId);
		}
		else {
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
	}

	// check that the given attributes match the user
	async checkAttributes () {
		// can't confirm a deactivated account
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		// can't set a different email (though we tolerate case variance)
		if (this.user.get('searchableEmail') !== this.request.body.email.toLowerCase()) {
			throw this.errorHandler.error('emailMismatch');
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
		if ((this.user.get('teamIds') || []).length === 0) {
			return;
		}
		const username = this.request.body.username || this.user.get('username');
		if (!username) {
			return;
		}
		// we check against each team the user is on, it must be unique in all teams
		const teamIds = this.user.get('teamIds');
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

	// confirmation successful, now generate an access token for the user to use
	// for all future requests
	async generateToken () {
		try {
			this.accessToken = Tokenizer(
				this.user.attributes,
				this.api.config.secrets.auth
			);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('token', { reason: message });
		}
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
				registeredAt: now,
				accessToken: this.accessToken
			},
			'$unset': {
				confirmationCode: true,
				confirmationAttempts: true,
				confirmationCodeExpiresAt: true
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

	// grant the user permission to subscribe to various messager channels
	async grantSubscriptionPermissions () {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		try {
			await new UserSubscriptionGranter({
				data: this.data,
				messager: this.api.services.messager,
				user: this.user,
				request: this
			}).grantAll();
		}
		catch (error) {
			throw this.errorHandler.error('messagingGrant', { reason: error });
		}
	}

	// get the initial data to return in the response, this is a time-saver for the client
	// so it doesn't have to fetch this data with separate requests
	async getInitialData () {
		this.initialData = await new InitialDataFetcher({
			request: this
		}).fetchInitialData();
	}

	// form the response to the request
	async formResponse () {
		this.responseData = {
			user: this.user.getSanitizedObjectForMe(),	// include me-only attributes
			accessToken: this.accessToken,				// access token to supply in future requests
			pubnubKey: this.api.config.pubnub.subscribeKey	// give them the subscribe key for pubnub
		};
		Object.assign(this.responseData, this.initialData);
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
}

module.exports = ConfirmRequest;
