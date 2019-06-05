// this class should be used to create all team documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Team = require('./team');
const CompanyCreator = require(process.env.CS_API_TOP + '/modules/companies/company_creator');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamSubscriptionGranter = require('./team_subscription_granter');
const TeamAttributes = require('./team_attributes');
const Errors = require('./errors');
const WebmailCompanies = require(process.env.CS_API_TOP + '/etc/webmail_companies');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

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
		return {
			required: {
				string: ['name']
			}
		};
	}

	// validate attributes for the team we are creating
	async validateAttributes () {
		this.validator = new CodeStreamModelValidator(TeamAttributes);
		return this.validateName();
	}

	// validate the name attribute
	validateName () {
		let error = this.validator.validateString(this.attributes.name);
		if (error) {
			return { name: error };
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
		await this.createCompany();			// create a company along with the team, as needed
		await this.createTeamStream();		// create a stream for the entire team
		await super.preSave();
	}

	// create a company document for the team ... for now there is a 1-1 relationship between companies and teams,
	// until we support the notion of multiple teams in a company
	async createCompany () {
		if (this.attributes.companyId) {
			return;
		}
		let company = this.attributes.company || {};
		company.name = this.determineCompanyName();	// company name is determined from the user's email
		company.teamIds = [this.attributes.id];
		this.transforms.createdCompany = await new CompanyCreator({
			request: this.request
		}).createCompany(company);
		this.attributes.companyId = this.transforms.createdCompany.id;
	}

	// create a stream for the entire team, everyone on the team is always a member of this stream
	async createTeamStream () {
		let stream = {
			teamId: this.attributes.id,
			type: 'channel',
			name: 'general',
			isTeamStream: true
		};
		this.transforms.createdTeamStream = await new StreamCreator({
			request: this.request
		}).createStream(stream);
	}

	// determine a name for this company, based on the user's domain or email
	determineCompanyName () {
		// if the user previously set a company name, just use that
		if (this.user.get('companyName')) {
			return this.user.get('companyName');
		}

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
		await this.updateUser();	// update the current user to indicate they are a member of the team
		await this.grantUserMessagingPermissions();		// grant permission to the team creator to subscribe to the team broadcaster channel
		await this.sendTeamCreatedEmail();	// send email to us that a new team has been created
	}

	// update a user to indicate they have been added to a new team
	async updateUser () {
		// add the team's ID to the user's teamIds array, and the company ID to the companyIds array
		const op = {
			$addToSet: {
				companyIds: this.attributes.companyId,
				teamIds: this.model.id
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.updateUserJoinMethod(this.user, op);
		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// update the joinMethod attribute for the user, if this is their first team
	updateUserJoinMethod (user, op) {
		// join method only applies if this is the user's first team
		const teamIds = user.get('teamIds') || [];
		if (teamIds.length > 0) {
			return;
		}

		// we can set both joinMethod and primaryReferral here
		const set = {};
		if (!user.get('joinMethod')) {
			set.joinMethod = 'Created Team';
		}
		if (!user.get('primaryReferral')) {
			set.primaryReferral = 'external';
		}
		// user created this team, so their origin team is this one if one isn't defined already
		if (!user.get('originTeamId')) {
			set.originTeamId = this.model.id;
		}
		if (Object.keys(set).length === 0) {
			// nothing to update
			return;
		}

		op.$set = op.$set || {};
		Object.assign(op.$set, set);
	}

	// grant permission to the team creator to subscribe to the team broadcaster channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			team: this.model,
			members: [this.user],
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
		if (this.model) {
			[ 'pez@codestream.com', 'dave@codestream.com', 'claudio@codestream.com', 'scott@codestream.com' ].forEach(email => {
				if (this.api.config.email.replyToDomain === 'prod.codestream.com') {
					this.api.services.email.queueEmailSend(
						{
							type: 'teamCreated',
							userId: this.user.id,
							teamName: this.model.get('name'),
							to: email
						},
						{
							request: this.request
						}
					);
				}
				else {
					this.request.log('Would have sent email created email to ' + email);
				}
			});
		}
	}
}

module.exports = TeamCreator;
