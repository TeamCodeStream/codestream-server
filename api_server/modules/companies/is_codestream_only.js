'use strict';

const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

// determine if a company is "codestream only", with a check against New Relic 
// note that there is a side effect, if the company is found by asking New Relic
// to no longer be codestream-only, that the company will be updated
// the caller should be prepared to broadcast this in the postProcess phase by
// checking request.transforms.updateCompanyNoCSOnly 

module.exports = async function (company, request, adminUser = null) {
	// if company is not linked to an NR org, we'll assume it's codestream only
	// this shouldn't really happen under unified identity, once migrated
	if (!company.get('linkedNROrgId')) { 
		request.log('NEWRELIC IDP TRACK: Company is not linked to an NR org, so is CS only');
		return true;
	}

	// if company is already not marked as codestream only, that's that
	if (!company.get('codestreamOnly')) {
		request.log('NEWRELIC IDP TRACK: Company is already marked as codestreamOnly, so is not CS only');
		return false;
	}
	
	// check with NR to see if we can still set this company as codestream only
	const options = { request, adminUser };
	if (request.request.headers['x-cs-no-newrelic']) {
		options.mockResponse = true;
		options.mockNoCodeStreamOnly = request.request.headers['x-cs-mock-no-cs-only'] || false;
		request.log('NOTE: not checking NR for codestream-only status, sending mock response');
	}

	request.log('NEWRELIC IDP TRACK: Checking with IdP service if org is still CS only');
	const stillCodeStreamOnly = await request.api.services.idp.isNROrgCodeStreamOnly(
		company.get('linkedNROrgId'),
		company.get('everyoneTeamId'),
		options
	);
	request.log('NEWRELIC IDP TRACK: stillCodeStreamOnly=' + stillCodeStreamOnly);
	if (stillCodeStreamOnly) {
		return true;
	}

	// update the company, the caller should be prepared to broadcast this in the postProcess phase by
	// checking request.transforms.updateCompanyNoCSOnly 
	request.log(`Setting company ${company.id} as not codestream-only...`);
	const op = {
		$set: {
			codestreamOnly: false
		},
		$unset: {
			domainJoining: true
		}
	};

	// putting the op here ensures that correct version info will be attached to the op,
	// preparing the op to be broadcast during the postProcess phase of the request
	request.transforms.updateCompanyNoCSOnly = await new ModelSaver({
		request,
		collection: request.data.companies,
		id: company.id
	}).save(op);

	return false;
}