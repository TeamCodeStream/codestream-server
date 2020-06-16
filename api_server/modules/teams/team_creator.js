// this class should be used to create all team documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Team = require('./team');
const CompanyCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/company_creator');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const TeamSubscriptionGranter = require('./team_subscription_granter');
const TeamAttributes = require('./team_attributes');
const Errors = require('./errors');
const WebmailCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/webmail_companies');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const StreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const DefaultTags = require('./default_tags');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

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
			},
			optional: {
				string: ['companyId'],
				object: ['company']
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
		this.attributes.createdAt = Date.now();
		this.attributes.creatorId = this.user.id;	// user making the request is the team creator
		this.attributes.memberIds = [this.user.id];	// user creating the team should always be a member
		this.attributes.adminIds = [this.user.id];	// user creating the team becomes its administrator
		this.attributes.tags = DeepClone(DefaultTags);	// default tags for codemarks

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

		await this.createOrAttachToCompany();	// create a company along with the team, or attach to an existing company
		await this.createTeamStream();		// create a stream for the entire team
		await super.preSave();
	}

	// create a company document for the team, or if the company ID is provided, update the company
	async createOrAttachToCompany () {
		if (this.attributes.companyId) {
			return this.attachToCompany();
		}
		else {
			return this.createCompany();
		}
	}

	// attach the team to an existing company 
	async attachToCompany () {
		// get the company
		this.company = await this.data.companies.getById(this.attributes.companyId);
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		} 

		// can only attach to a company that was created by the same user creating the team
		if (!(this.user.get('companyIds') || []).includes(this.company.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user can only attach a team to a company they are a member of' });
		}

		const op = {
			$addToSet: {
				teamIds: this.attributes.id
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.transforms.companyUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.companies,
			id: this.company.id
		}).save(op);
	}

	// create a company for the team
	async createCompany () {
		const company = this.attributes.company || {};
		company.name = company.name || this.determineCompanyName();	// company name is determined from the user's email
		this.company = this.transforms.createdCompany = await new CompanyCreator({
			request: this.request,
			teamIds: [this.attributes.id]
		}).createCompany(company);
		this.attributes.companyId = this.transforms.createdCompany.id;
		delete this.attributes.company;
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
			$unset: {
				companyName: true
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
					this.request.log(`Triggering team-created email for team ${this.model.id} ("${this.model.get('name')}")...`);
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
					this.request.log('Would have sent team created email to ' + email);
				}
			});
		}
	}
}

module.exports = TeamCreator;
