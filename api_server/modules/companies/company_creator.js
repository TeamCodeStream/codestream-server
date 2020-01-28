// this class should be used to create all company documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Company = require('./company');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

const TRIAL_PERIOD_FOR_30_DAY_TRIAL = 36 * 24 * 60 * 60 * 1000;	// NOTE - this is 36 days, which gives breathing room

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

		// default this team to a 30-day trial
		// now that we have createdAt, start the trial ticket from that time forward
		this.attributes.plan = '30DAYTRIAL';
		this.attributes.trialStartDate = this.attributes.createdAt;
		this.attributes.trialEndDate = this.attributes.trialStartDate + TRIAL_PERIOD_FOR_30_DAY_TRIAL;

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
}

module.exports = CompanyCreator;
