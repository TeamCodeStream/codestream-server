// this class should be used to create all company documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Company = require('./company');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const LicenseManager = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/LicenseManager');

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
			}
		};
	}

	// right before saving...
	async preSave () {
		this.attributes.createdAt = Date.now();
		this.attributes.creatorId = this.user.id;	// creator is the user making the request
		this.attributes.teamIds = this.teamIds || [];

		// default this team to a 14-day trial
		// now that we have createdAt, start the trial ticket from that time forward
		const onPrem = this.isOnPrem();
		// FIXMECOLIN - this gets our default license
		this.attributes.plan = new LicenseManager({ isOnPrem: onPrem }).getMyLicense().plan;
		if (onPrem) {
			this.attributes.trialStartDate = this.attributes.createdAt;
			this.attributes.trialEndDate = this.attributes.trialStartDate + TRIAL_PERIOD_FOR_14_DAY_TRIAL;
		}

		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await super.preSave();
	}

	// after the team has been saved...
	async postSave () {
		await super.postSave();
		await this.updateUser();	// update the current user to indicate they are a member of the company
	}

	// update a user to indicate they have been added to a new company
	async updateUser () {
		// add the company's ID to the user's companyIds array
		const op = {
			$addToSet: {
				companyIds: this.model.id
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// is this an on-prem installation?
	isOnPrem () {
		return this.request.api.config.sharedGeneral.isOnPrem;
	}
}

module.exports = CompanyCreator;
