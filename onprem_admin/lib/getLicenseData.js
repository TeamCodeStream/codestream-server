'use strict';

async function getLicenseData(mongoClient) {
	const licenseData = await mongoClient.db()
		.collection('companies')
		.find({ plan: { $exists: true } })
		.sort({ plan: -1 })
		.toArray();
	const licenses = {};
	let isTrial = false;
	// let isExpired = false;
	licenseData.forEach((company) => {
		const thisLicense = company.plan === '14DAYTRIAL' ? 'TRIAL' : company.plan;
		licenses[thisLicense] = 1;
		if (thisLicense.match(/trial/i)) isTrial = true;
	});
	// the license doesn't get added to the database until after the first codemark
	// is created so we assume a 14DAYTRIAL license for a pre-used database.
	// if (!Object.keys(licenses).length) licenses.push('14DAYTRIAL');
	if (!Object.keys(licenses).length) {
		licenses.push('TRIAL');
	}
	return { licenses: Object.keys(licenses), isTrial };
}

export default getLicenseData;
