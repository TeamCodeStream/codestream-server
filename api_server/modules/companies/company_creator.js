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
			this.attributes.hasBeenMigratedToCompanyCentric = true; // new companies are company-centric by default
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

	// after company model is created and saved...
	async postSave () {
		// handle signing the user up or in with third-party Identity Provider
		await this.handleIdPSignup();
	}

	// upon company creation is where we first register the user with our third-party Identity Provider
	// (i.e. NewRelic/Azure) ... even if the user is creating a second org to be a member of, 
	// under one-user-per-org, it's more or less functionally the same as signing up
	async handleIdPSignup () {
		if (!this.api.services.idp) { return; }

		let password;
		const encryptedPassword = this.user.get('encryptedPasswordTemp');
		if (encryptedPassword) {
			password = await this.decryptPassword(encryptedPassword)
		}

		const name = this.user.get('fullName') || this.user.get('email').split('@')[0];
		const nrUserInfo = await this.api.services.idp.fullSignup(
			{
				name: name,
				email: this.user.get('email'),
				password
			},
			{ 
				request: this.request
			}
		);

		// save NR user info obtained from the signup process
		await this.request.data.users.update(
			{
				id: this.user.id,
				nrUserInfo,
				nrUserId: nrUserInfo.user_id
			}
		);

		// save New Relic's organization info with the company
		// NOTE - we do this post-save of creating the company to ensure that a failure
		// here doesn't end up with an orphaned user and organization on New Relic,
		// better to do it once we're (reasonably) sure things are going to succeed on our end
		const nrOrgInfo = { ... nrUserInfo };
		delete nrOrgInfo.user_id;
		await this.request.data.companies.update(
			{
				id: this.model.id,
				nrOrgId: nrUserInfo.organization_id,
				nrOrgInfo,
				codestreamOnly: true
			}
		);
	}

	// decrypt the user's stored password, which is encrypted upon registration for
	// temporary maintenance during the signup flow
	async decryptPassword (encryptedPassword) {
		return this.request.api.services.passwordEncrypt.decryptPassword(encryptedPassword);
	}
}

module.exports = CompanyCreator;
