'use strict';

const Handlebars = require('handlebars');

/* eslint complexity: 0 */
module.exports = function(options) {

	const { user, team, company, module, request } = options;
	const userId = user && user.id;
	const email = user && user.get('email');
	const joinMethod = user && user.get('joinMethod');
	const lastInviteType = user && user.get('lastInviteType');
	const userRegisteredAt = user && new Date(user.get('registeredAt')).toISOString();
	const fullName = user && user.get('fullName');
	const dateOfLastPost = user && user.get('lastPostCreatedAt') &&
		new Date(user.get('lastPostCreatedAt')).toISOString();
	const countryCode = user && user.get('countryCode');
	const teamId = team && team.id;
	const teamName = team && team.get('name');
	const teamSize = team && team.getActiveMembers().length;
	const teamCreatedAt = team && new Date(team.get('createdAt')).toISOString();
	const reportingGroup = company && company.get('reportingGroup');
	const companyName = company && company.get('name');
	const companyId = company && company.id;
	const companyPlan = company && company.get('plan');
	const companyCreatedAt = company && new Date(company.get('createdAt')).toISOString();
	let trialStartAt, trialEndAt, abTest;
	if (company && company.get('trialStartDate')) {
		trialStartAt = new Date(company.get('trialStartDate')).toISOString();
	}
	if (company && company.get('trialEndDate')) {
		trialEndAt = new Date(company.get('trialEndDate')).toISOString();
	}
	if (company && company.get('testGroups')) {
		// this has to be a string that looks like an array in javascript
		abTest = '[' + Object.keys(company.get('testGroups')).map(key => {
			const safe = Handlebars.escapeExpression(`${key}|${company.get('testGroups')[key]}`);
			return `"${safe}"`;
		}).join(',') + ']';
	} else {
		abTest = '[]';
	}
	const codeStreamOnly = !!(company && company.get('codestreamOnly'));
	const orgOrigination = (company && company.get('orgOrigination')) || '';

	let nrUserId, nrOrgId;
	if (user.get('nrUserId')) {
		nrOrgId = user.get('nrUserId');
	}
	if (company && company.get('linkedNROrgId')) {
		nrOrgId = company.get('linkedNROrgId');
	}

	let region = undefined;
	const { environmentGroup } = request.api.config;
	const { runTimeEnvironment } = request.api.config.sharedGeneral;
	if (environmentGroup && environmentGroup[runTimeEnvironment]) {
		region = environmentGroup[runTimeEnvironment].name;
	}

	const props = {
		userId,
		email,
		joinMethod,
		lastInviteType,
		userRegisteredAt,
		fullName,
		dateOfLastPost,
		countryCode,
		teamId,
		teamName,
		teamSize,
		teamCreatedAt,
		companyPlan,
		reportingGroup,
		companyName,
		companyId,
		companyCreatedAt,
		trialStartAt,
		trialEndAt,
		abTest,
		codeStreamOnly,
		orgOrigination,
		nrUserId,
		nrOrgId,
		region
	};
	return module.evalTemplateNoSend('identify_script', props);
};