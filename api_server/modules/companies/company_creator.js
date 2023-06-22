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
		const requiredAllowedAttributes = {
			required: {
				string: ['name']
			},
			optional: {
				'array(string)': ['domainJoining']
			}
		};
		
		if (this.nrOrgInfoOK) {
			// this means info associated with the New Relic org is being passed from the caller
			// (not the user doing a POST /companies request, which we don't want to allow)
			Object.assign(requiredAllowedAttributes.optional, {
				string: ['linkedNROrgId', 'orgOrigination'],
				boolean: ['codestreamOnly']
			});
		}

		return requiredAllowedAttributes;
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

		// set company name if user entered it earlier
		if (this.user.get('companyName')) {
			this.attributes.name = this.user.get('companyName');
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
		if (this.skipIDPSignup) { return; }
		if (!this.api.services.idp) { return; }
		if (!this.request.request.headers['x-cs-enable-uid']) { return; }
		let mockResponse;
		if (this.request.request.headers['x-cs-no-newrelic']) {
			mockResponse = true;
			this.request.log('NOTE: not handling IDP signup, sending mock response');
		}

		let password;
		const encryptedPassword = this.user.get('encryptedPasswordTemp');
		if (encryptedPassword) {
			password = await this.decryptPassword(encryptedPassword)
		}

		const name = this.user.get('fullName') || this.user.get('email').split('@')[0];
		const {
			signupResponse,
			nrUserInfo,
			token,
			refreshToken,
			expiresAt,
			generatedPassword
		} = await this.api.services.idp.fullSignup(
			{
				name: name,
				email: this.user.get('email'),
				password,
				orgName: this.user.get('companyName') || this.attributes.name
			},
			{ 
				request: this.request,
				mockResponse
			}
		);
		this.password = generatedPassword || password; // save because caller needs to obtain a refresh token later in the process
	
		// for some insane reason, the user_id comes out as a string 
		if (typeof nrUserInfo.id === 'string') {
			nrUserInfo.id = parseInt(nrUserInfo.id, 10);
			if (!nrUserInfo.id || isNaN(nrUserInfo.id)) {
				throw this.errorHandler.error('internal', { reason: 'provisioned user had non-numeric ID from New Relic' });
			}
		}
			
		const set = {
			nrUserInfo: {
				userTier: nrUserInfo.attributes.userTier,
				userTierId: nrUserInfo.attributes.userTierId
			},
			nrUserId: nrUserInfo.id,
			[ `providerInfo.${this.attributes.everyoneTeamId}.newrelic.accessToken` ]: token,
			[ `providerInfo.${this.attributes.everyoneTeamId}.newrelic.refreshToken` ]: refreshToken,
			[ `providerInfo.${this.attributes.everyoneTeamId}.newrelic.expiresAt` ]: expiresAt,
			[ `providerInfo.${this.attributes.everyoneTeamId}.newrelic.bearerToken` ]: true
		};
		
		// if we are behind service gateway and using login service auth, we actually set the user's
		// access token to the NR access token, this will be used for normal requests
		const serviceGatewayAuth = await this.api.data.globals.getOneByQuery(
			{ tag: 'serviceGatewayAuth' }, 
			{ overrideHintRequired: true }
		);
		if (
			serviceGatewayAuth &&
			serviceGatewayAuth.enabled
		) {
			set.accessTokens = {
				web: {
					token,
					isNRToken: true,
					refreshToken,
					expiresAt
				}
			};		
			this.transforms.newAccessToken = token;
		}
		
		// save NR user info obtained from the signup process
		this.request.log('NEWRELIC IDP TRACK: Saving providerInfo from IDP signup');
		await this.data.users.applyOpById(
			this.user.id,
			{
				$set: set,
				$unset: {
					encryptedPasswordTemp: true,
					companyName: true,
					originalEmail: true
				}
			}
		);

		// save New Relic's organization info with the company
		// NOTE - we do this post-save of creating the company to ensure that a failure
		// here doesn't end up with an orphaned user and organization on New Relic,
		// better to do it once we're (reasonably) sure things are going to succeed on our end
		await this.request.data.companies.update(
			{
				id: this.model.id,
				linkedNROrgId: signupResponse.organization_id,
				nrOrgInfo: {
					authentication_domain_id: signupResponse.authentication_domain_id,
					account_id: signupResponse.account_id
				},
				codestreamOnly: true,
				orgOrigination: 'CS'
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
