'use strict';

const Indexes = require('./indexes');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

// look for any companies with domain-based joining that match the domain of the user's email
const _getEligibleJoinCompaniesByDomain = async (domain, request) => {
	const companies = await request.data.companies.getByQuery(
		{
			domainJoining: domain,
			deactivated: false
		},
		{
			hint: Indexes.byDomainJoining 
		}
	);
	return companies.map(company => { 
		return { company, domain };
	});
};

// look for any companies the specific user has been invited to (either registered or unregistered)
const _getEligibleJoinCompaniesByUserInvite = async (user, request) => {
	// in theory, for ONE_USER_PER_ORG, there should only be (at most) one company for each user record
	const companyIds = user.companyIds || [];
	if (companyIds.length > 0) {
		return await request.data.companies.getByIds(companyIds);
	} else {
		return [];
	}
};

// look for any companies the user has been invited to (either registered or unregistered)
const _getEligibleJoinCompaniesByInvite = async (email, request) => {
	const users = await request.data.users.getByQuery(
		{
			searchableEmail: email.toLowerCase()
		}, 
		{
			hint: UserIndexes.bySearchableEmail,
			fields: ['companyIds', 'isRegistered', 'accessTokens', 'externalUserId'],

			// this is important because it can overwrite changes to user updates
			// in progress at a higher level
			noCache: true 
		}
	);

	// collect each company each user record is invited to
	// each user record should, in theory, have only one company
	const companies = [];
	await Promise.all(users.map(async user => {
		if (!user.externalUserId) {  // suppress "faux" users, i.e., users created by virtue of a slack reply
			const companiesByUser = await _getEligibleJoinCompaniesByUserInvite(user, request);
			companies.push.apply(companies, companiesByUser.map(company => { 
				return { company, user };
			}));
		}
	}));

	return companies;
};

module.exports = async function GetEligibleJoinCompanies (domain, request, options = {}) {
	let email;
	if (domain.match(/@/)) {
		// really an email ... remove this check and just accept email when we have fully moved to ONE_USER_PER_ORG
		email = domain;
		domain = EmailUtilities.parseEmail(email).domain.toLowerCase();
	}

	// companies are eligible to be joined either by domain or by invite (or both)
	const companiesByDomain = !options.ignoreDomain ?
		await _getEligibleJoinCompaniesByDomain(domain, request) :
		[];
	const companiesByInvite = (email && !options.ignoreInvite) ?
		await _getEligibleJoinCompaniesByInvite(email, request) :
		[];

	// if the user is invited to any companies that are also available by domain,
	// the invite record should override
	for (let i = companiesByDomain.length - 1; i >= 0; i--) {
		if (companiesByInvite.find(c => c.company.id === companiesByDomain[i].company.id)) {
			companiesByDomain.splice(i, 1);
		}
	}
	
	const allCompanies = [ ...companiesByDomain, ...companiesByInvite ];

	// return information about those companies (but not full company objects, 
	// since the user is not necessarily a member (yet))
	const eligibleJoinCompanies = [];
	await Promise.all(allCompanies.map(async companyInfo => {
		const { company, user, domain } = companyInfo;
		const memberCount = await company.getCompanyMemberCount(request.data);
		const joinCompany = {
			id: company.id,
			teamId: company.get('everyoneTeamId'),
			name: company.get('name'),
			domainJoining: user ? undefined : company.get('domainJoining') || [],
			codeHostJoining: user ? undefined : company.get('codeHostJoining') || [],
			memberCount
		};
		if (user) {
			joinCompany.byInvite = true;
			if (user.isRegistered) {
				joinCompany.accessToken = ((user.accessTokens || {}).web || {}).token;
			}
		} else {
			joinCompany.byDomain = domain;
		}
		eligibleJoinCompanies.push(joinCompany);
	}));

	// add on any eligible join companies from across all environments
	if (!options.dontFetchCrossEnvironment) {
		if (request.request.headers['x-cs-block-xenv']) {
			request.log('Not doing cross-environment fetching of eligible join companies, blocked by header');
		} else {
			const crossEnvironmentCompanies = 
				await request.api.services.environmentManager.fetchEligibleJoinCompaniesFromAllEnvironments(email || domain);
			crossEnvironmentCompanies.forEach(company => {
				company.company.host = company.host;
				eligibleJoinCompanies.push(company.company);
			});
		}
	}

	return eligibleJoinCompanies;
};