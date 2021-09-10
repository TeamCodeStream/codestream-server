// this class should be used to create all company documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Company = require('./company');
const LicenseManager = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/LicenseManager');
const CompanyValidations = require('./company_validations');

///const TRIAL_PERIOD_FOR_30_DAY_TRIAL = 36 * 24 * 60 * 60 * 1000;	// NOTE - this is 36 days, which gives breathing room
const TRIAL_PERIOD_FOR_14_DAY_TRIAL = 16 * 24 * 60 * 60 * 1000; // NOTE - this is 16 days, which gives breathing room

class CompanyCreator extends ModelCreator {

	get modelClass () {
		return Company;	// class to use to create a company model
	}

	get collectionName () {
		return 'companies'; // data collection to use
	}

	// convenience wrapper
	async createCompany (attributes) {
		return await this.createModel(attributes);
	}

	// these attributes are required or optional to create a company document,
	// others will be ignored
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['name']
			},
			optional: {
				'array(string)': ['domainJoining', 'codeHostJoining']
			}
		};
	}

	// validate attributes for the company we are creating
	async validateAttributes () {
		return CompanyValidations.validateAttributes(this.attributes);
	}

	// right before saving...
	async preSave () {
		this.createId();
		this.attributes.createdAt = Date.now();
		this.attributes.creatorId = this.user.id;	// creator is the user making the request

		// create an "everyone" team, as needed
		if (!(this.teamIds || []).length) {
			if (!this.request.teamCreatorClass) { // this avoids a circular require
				throw new Error('must provide teamCreatorClass in request calling CompanyCreator');
			}
			this.transforms.createdTeam = await new this.request.teamCreatorClass({
				request: this.request,
				teamIds: [this.attributes.id],
				isEveryoneTeam: true,
				dontAttachToCompany: true
			}).createTeam({
				companyId: this.attributes.id,
				name: "Everyone"
			});
			this.teamIds = [this.transforms.createdTeam.id];
			this.attributes.everyoneTeamId = this.transforms.createdTeam.id;
		}
		this.attributes.teamIds = this.teamIds || [];

		// now that we have createdAt, start the trial ticket from that time forward
		const onPrem = this.isOnPrem();
		// this gets our default license
		// FIXME: this call should include { db: MongoClient.db() } in the options!
		this.attributes.plan = (await new LicenseManager({ isOnPrem: onPrem }).getMyLicense()).plan;
		if (onPrem) {
			this.attributes.trialStartDate = this.attributes.createdAt;
			this.attributes.trialEndDate = this.attributes.trialStartDate + TRIAL_PERIOD_FOR_14_DAY_TRIAL;
		}

		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await super.preSave();
	}

	// is this an on-prem installation?
	isOnPrem () {
		return this.request.api.config.sharedGeneral.isOnPrem;
	}
}

module.exports = CompanyCreator;
