'use strict';

// A simple license manager
// 
// license === plan (these are equivilent)
// If (isOnPrem) {
//     one license per installation (company-agnostic)
// } else {
//     one license per company
// }

// This object defines the properties we can associate with a license
// It is a public-facing struct.
const PlanPropertiesType = {
	plan: 1,			// plan name (from companies collection)
	isTrial: 1,
	isPaid: 1,
	isExpired: 1,
	expirationDate: 1,
	grantDate: 1,
	featureSet: {
		numSeats: 1,
		featureX: 1, // custom feature names go here
		featureY: {
			// and so on
		},
	},
};

const PlanProperties = {
	'14DAYTRIAL': {
		isTrial: true,
	},
	'30DAYTRIAL': {
		isTrial: true,
	},
	TRIALEXPIRED: {
		isTrial: true,
		isExpired: true,
	},
	UNEXPIRED: {},
	FREEPLAN: {},
	SALES: {
		isTrial: true,
	},
	BUSINESS: {
		isPaid: true,
	},
	ENTERPRISE: {
		isPaid: true,
	},
};

// each LicenseManager object can be associated with 0 or 1 company
class LicenseManager {
	constructor(options) {
		this.logger = options.logger || console;
		this.isOnPrem = options.isOnPrem || false;
		this.company = options.company || null; // company document from mongo
		this.db = options.db || null; // mongodb db handle
		this.license = null; // object containing license props (public-facing)
	}

	paidPlans() {
		return Object.keys(PlanProperties).filter((plan) => PlanProperties[plan].isPaid);
	}

	async isPaidPlan() {
		return await this.getMyLicense().isPaid;
	}

	async isInTrial() {
		return await this.getMyLicense().isTrial;
	}

	_defaultLicense() {
		const plan = this.isOnPrem ? '14DAYTRIAL' : 'FREEPLAN';
		return {
			plan,
			...PlanProperties[plan]
		}
	}

	// FIXME: This needs work.
	//
	// For onprem, we look at all plans in the companies collection. If there's
	// none, we create a virtual license with the assumption of a 14DAYTRIAL
	// since that's what the API inserts by default.
	//
	// If there's more than one, we use the first license we see that is NOT
	// a trial license and assume that one covers the installation.
	async _getOnPremLicense(db = null) {
		if (db) this.db = db;
		const dbLicenses = await this.db
			.collection('companies')
			.find({ plan: { $exists: true } })
			.sort({ plan: -1 })
			.toArray();
		dbLicenses.forEach((company) => {
			const companyLicense = { plan: company.plan };
			if (company.plan in PlanProperties) {
				Object.assign(companyLicense, PlanProperties[company.plan]);
			}
			if (!this.license || (this.license.isTrial && !companyLicense.isTrial)) {
				this.license = companyLicense;
			}
		});
		// brand new onprem installations have no docs in the companies
		// collection until the first user registers so we use this as a
		// default license.
		if (!this.license) this.license = this._defaultLicense();

		return this.license;
	}

	async getMyLicense() {
		if (this.license) return this.license;
		if (this.isOnPrem) return await this._getOnPremLicense();
		if (!this.company.plan) {
			this.license = this._defaultLicense();
		} else {
			this.license = { plan: this.company.plan };
			if (this.company.plan in PlanProperties) Object.assign(this.license, PlanProperties[this.company.plan]);
		}
		return this.license;
	}
}

module.exports = LicenseManager;
