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

class TeamCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.dontSaveIfExists = true;	// if a matching team exists, don't save, but just return the existing team
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
		return {
			required: {
				string: ['name']
			},
			optional: {
				'string': ['primaryReferral'],
				'array(string)': ['memberIds', 'emails'],
				'array(object)': ['users']
			}
		};
	}

	// validate attributes for the team we are creating
	async validateAttributes () {
		this.validator = new CodeStreamModelValidator(TeamAttributes);
		this.setDefaults();
		return this.validateName() ||
			this.validateMemberIds() ||
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

	// validate the array of member IDs
	validateMemberIds () {
		let error = this.validator.validateArrayOfIds(this.attributes.memberIds);
		if (error) {
			return { memberIds: error };
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

	// set the default attributes (in advance of validation)
	setDefaults () {
		this.ensureUserIsMember();	// ensure the current user is in the array of member IDs
	}

	// ensure the current user (user making the request) is in the array of member IDs for the team
	ensureUserIsMember () {
		this.attributes.memberIds = this.attributes.memberIds || [this.user.id];
		if (!(this.attributes.memberIds instanceof Array)) {
			return; // this will get caught later
		}
		if (!this.attributes.memberIds.includes(this.user.id)) {
			this.attributes.memberIds.push(this.user.id);
		}
		this.attributes.memberIds.sort();
	}

	// return database query to check if a matching team already exists
	checkExistingQuery () {
		// note: this isn't really relevant right now, because we don't allow to specify companyId yet (if ever?)
		if (!this.attributes.companyId) {
			return; // no need if no company yet, this will be the first team for this company
		}
		let query = {
			companyId: this.attributes.companyId
		};
		if (this.attributes.name) {
			query.name = this.attributes.name;
		}
		else {
			query.memberIds = this.attributes.memberIds;
		}
		return query;
	}

	// return whether a matching team can exist or if an error should be returned
	modelCanExist () {
		// we won't allow two teams in the same company with the same name, but not a concern right now (or ever?)
		return !this.attributes.name;
	}

	// called before the team is actually saved
	async preSave () {
		this.attributes.creatorId = this.user.id;	// user making the request is the team creator
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await this.checkCreateUsers();		// check if we are being asked to create users on-the-fly with the team creation
		await this.checkUsernamesUnique();	// check that for all users being added, that all the usernames will be unique
		await this.createCompany();			// create a company along with the team, as needed
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
		if (!this.usersCreated) { return; }
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
		await this.grantUserMessagingPermissions();	// grant permission to each user on the team to subscribe to the team messager channel
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
			throw this.errorHandler.error('messagingGrant', { reason: error });
		}
	}
}

module.exports = TeamCreator;
