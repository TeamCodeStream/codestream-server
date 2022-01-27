'use strict';

const Indexes = require('./indexes');

module.exports = async function GetEligibleJoinCompanies (domain, request, options = {}) {
	// look for any companies with domain-based joining that match the domain of the user's email
	const companies = await request.data.companies.getByQuery(
		{
			domainJoining: domain,
			deactivated: false
		},
		{
			hint: Indexes.byDomainJoining 
		}
	);

	// return information about those companies (but not full company objects, 
	// since the user is not actually a member (yet))
	const eligibleJoinCompanies = [];
	for (const company of companies) {
		const memberCount = await company.getCompanyMemberCount(request.data);
		eligibleJoinCompanies.push({
			id: company.id,
			name: company.get('name'),
			byDomain: domain.toLowerCase(),
			domainJoining: company.get('domainJoining') || [],
			codeHostJoining: company.get('codeHostJoining') || [],
			memberCount
		});
	}

	// add on any eligible join companies from across all environments
	if (!options.dontFetchCrossEnvironment) {
		if (request.request.headers['x-cs-block-xenv']) {
			request.log('Not doing cross-environment fetching of eligible join companies, blocked by header');
		} else {
			const crossEnvironmentCompanies = await request.api.services.environmentManager.fetchEligibleJoinCompaniesFromAllEnvironments(domain);
			crossEnvironmentCompanies.forEach(company => {
				company.company.host = company.host;
				eligibleJoinCompanies.push(company.company);
			});
		}
	}

	return eligibleJoinCompanies;
};