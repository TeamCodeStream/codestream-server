// this class should be used to create all team documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Team = require('./team');
const CompanyCreator = require(process.env.CS_API_TOP + '/modules/companies/company_creator');
const UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamSubscriptionGranter = require('./team_subscription_granter');
const TeamAttributes = require('./team_attributes');
const Errors = require('./errors');
const WebmailCompanies = require(process.env.CS_API_TOP + '/etc/webmail_companies');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');

class TeamCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	get modelClass () {
		return Team;	// class to use to create a team model
	}

	get collectionName () {
		return 'teams';	// data collection to use
	}

	// convenience wrapper
	async createTeam (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for team creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		const requiredAndOptional = {
			required: {
				string: ['name']
			}
		};
		if (this.fromRepoCreator) {
			// we are deprecating the ability to create users or add them to a team directly ...
			// the preferred behavior will be to "invite" them to a team using POST /users ...
			// in the meantime, we need to continue to support the atom client and the old
			// onboarding, which allows invite of users to a team as part of the onboarding
			// process ... but we won't allow it for POST /teams directly
			requiredAndOptional.optional = {
				'array(string)': ['emails'],
				'array(object)': ['users']
			};
		}
		return requiredAndOptional;
	}

	// validate attributes for the team we are creating
	async validateAttributes () {
		this.validator = new CodeStreamModelValidator(TeamAttributes);
		return this.validateName() ||
			this.validateEmails() ||
			this.validateUsers();
	}

	// validate the name attribute
	validateName () {
		let error = this.validator.validateString(this.attributes.name);
		if (error) {
			return { name: error };
		}
	}

	// validate the array of emails, if given
	validateEmails () {
		if (!this.attributes.emails) { return; }
		let error = this.validator.validateArrayOfStrings(this.attributes.emails);
		if (error) {
			return { emails: error };
		}
	}

	// validate the user objects, if given
	validateUsers () {
		if (!this.attributes.users) { return; }
		let error = this.validator.validateArrayOfObjects(this.attributes.users);
		if (error) {
			return { users: error };
		}
	}

	// called before the team is actually saved
	async preSave () {
		this.createId();
		this.attributes.creatorId = this.user.id;	// user making the request is the team creator
		this.attributes.memberIds = [this.user.id];	// user creating the team should always be a member
		this.attributes.adminIds = [this.user.id];	// user creating the team becomes its administrator

		// allow third-party provider related attributes to be set by caller
		['providerInfo', 'providerIdentities'].forEach(attribute => {
			if (this[attribute]) {
				this.attributes[attribute] = this[attribute];
			}
		});

		// set some analytics, based on whether this is the user's first team
		const firstTeamForUser = (this.user.get('teamIds') || []).length === 0;
		this.attributes.primaryReferral = firstTeamForUser ? 'external' : 'internal';

		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}

		// TODO: deprecate all user adding/creation once we are fully migrated to sign-up on the web
		await this.checkCreateUsers();		// check if we are being asked to create users on-the-fly with the team creation
		await this.checkUsernamesUnique();	// check that for all users being added, that all the usernames will be unique
		await this.createCompany();			// create a company along with the team, as needed
		await this.createTeamStream();		// create a stream for the entire team
		await super.preSave();
	}

	// check if we are being asked to create users on-the-fly with the team creation, and do so if needed
	async checkCreateUsers () {
		// users can be specified by email, or by user object, which might also contain other user attributes
		let usersToCreate = (this.attributes.emails || []).map(email => {
			return { email: email };
		});
		if (this.attributes.users instanceof Array) {
			let usersToAdd = this.attributes.users.filter(user => !!user.email);
			usersToCreate = usersToCreate.concat(usersToAdd);
		}
		this.usersCreated = [];
		await Promise.all(usersToCreate.map(async user => {
			await this.createUser(user);
		}));
		delete this.attributes.emails;
		delete this.attributes.users;
	}

	// create a user on-the-fly, who will become part of the team
	async createUser (user) {
		this.userCreator = new UserCreator({
			request: this.request,
			dontSaveIfExists: true,	// if the user exists, just return that user, no need to save
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		const userCreated = await this.userCreator.createUser(user);
		this.usersCreated.push(userCreated);
		if (userCreated.id !== this.user.id) {
			this.attributes.memberIds.push(userCreated.id);
		}
	}

	// check that among all the users being added, none of the usernames conflict with each other or with the team creator
	async checkUsernamesUnique () {
		if (!this.usersCreated || this.usersCreated.length === 0) { return; }
		let usernames = this.usersCreated.map(user => user.get('username') ? user.get('username').toLowerCase() : null);
		usernames.push(this.user.get('username') ? this.user.get('username').toLowerCase() : null);
		usernames = usernames.filter(username => !!username);
		usernames.sort();
		let i, len;
		for (i = 0, len = usernames.length; i < len; i++) {
			if (i > 0 && usernames[i].localeCompare(usernames[i-1]) === 0) {
				break;
			}
		}
		if (i < len) {
			throw this.errorHandler.error('usernameNotUnique', { info: usernames[i] });
		}
	}

	// create a company document for the team ... for now there is a 1-1 relationship between companies and teams,
	// until we support the notion of multiple teams in a company
	async createCompany () {
		if (this.attributes.companyId) {
			return;
		}
		let company = this.attributes.company || {};
		company.name = this.determineCompanyName();	// company name is determined from the user's email
		this.company = await new CompanyCreator({
			request: this.request
		}).createCompany(company);
		this.attributes.companyId = this.company.id;
		this.attachToResponse.company = this.company.getSanitizedObject();
	}

	// create a stream for the entire team, everyone on the team is always a member of this stream
	async createTeamStream () {
		let stream = {
			teamId: this.attributes._id,
			type: 'channel',
			name: 'general',
			isTeamStream: true
		};
		this.teamStream = await new StreamCreator({
			request: this.request
		}).createStream(stream);
		this.attachToResponse.streams = [
			this.teamStream.getSanitizedObject()
		];
	}

	// determine a name for this company, based on the user's domain or email
	determineCompanyName () {
		// if it's a webmail user, we just name the company after the whole email,
		// otherwise use the domain
		const email = EmailUtilities.parseEmail(this.user.get('email'));
		if (WebmailCompanies.includes(email.domain)) {
			return this.user.get('email');
		}
		else {
			return email.domain;
		}
	}

	// after the team has been saved...
	async postSave () {
		await super.postSave();
		await this.updateUsers();	// update the users who have been added to the team to indicate they are now indeed members
		await this.updateUserJoinMethod();	// update the joinMethod attribute for the user, as needed
		await this.grantUserMessagingPermissions();	// grant permission to each user on the team to subscribe to the team messager channel
		await this.sendTeamCreatedEmail();	// send email to us that a new team has been created
	}

	// update the users who have been added to the team to indicate they are now indeed members
	async updateUsers () {
		const users = [this.user, ...(this.usersCreated || [])];
		this.members = [];
		await Promise.all(users.map(async user => {
			await this.updateUser(user);
		}));
	}

	// update a user to indicate they have been added to a new team
	async updateUser (user) {
		// add the team's ID to the user's teamIds array, and the company ID to the companyIds array
		let op = {
			'$addToSet': {
				companyIds: this.attributes.companyId,
				teamIds: this.model.id
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
			op.$set.originTeamId = this.user.get('originTeamId') || this.model.id;
		}
		const updatedUser = await this.data.users.applyOpById(user.id, op);
		this.members.push(updatedUser);
	}

	// update the joinMethod attribute for the user, if this is their first team
	async updateUserJoinMethod () {
		// join method only applies if this is the user's first team
		if (
			this.user.get('teamIds').length !== 1 ||
			this.user.get('teamIds')[0] !== this.model.id
		) {
			return;
		}

		// we can set both joinMethod and primaryReferral here
		this.joinMethodUpdate = { $set: { } };
		if (!this.user.get('joinMethod')) {
			this.joinMethodUpdate.$set.joinMethod = 'Created Team';
		}
		if (!this.user.get('primaryReferral')) {
			this.joinMethodUpdate.$set.primaryReferral = 'external';
		}
		// user created this team, so their origin team is this one if one isn't defined already
		if (!this.user.get('originTeamId')) {
			this.joinMethodUpdate.$set.originTeamId = this.model.id;
		}
		if (Object.keys(this.joinMethodUpdate.$set).length === 0) {
			// nothing to update
			this.joinMethodUpdate = null;
			return;
		}
		await this.request.data.users.applyOpById(
			this.user.id,
			this.joinMethodUpdate
		);
	}

	// grant permission to the users on the team to subscribe to the team messager channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.model,
			members: this.users,
			request: this.request
		};
		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}

	// send email to us that a new team has been created
	async sendTeamCreatedEmail () {
		if (this.model && this.api.config.email.replyToDomain === 'prod.codestream.com') {
			this.api.services.email.queueEmailSend(
				{
					type: 'teamCreated',
					userId: this.user.id,
					teamName: this.model.get('name')
				},
				{
					request: this.request
				}
			);
		}
	}
}

module.exports = TeamCreator;
