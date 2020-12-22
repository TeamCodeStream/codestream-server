'use strict';

/* eslint complexity: 0 */
module.exports = function(options) {

	const { user, team, company, module } = options;
	const userId = user && user.id;
	const email = user && user.get('email');
	const joinMethod = user && user.get('joinMethod');
	const lastInviteType = user && user.get('lastInviteType');
	const userRegisteredAt = user && new Date(user.get('registeredAt')).toISOString();
	const fullName = user && user.get('fullName');
	const dateOfLastPost = user && user.get('lastPostCreatedAt') &&
		new Date(user.get('lastPostCreatedAt')).toISOString();
	const teamId = team && team.id;
	const teamName = team && team.get('name');
	const teamSize = team && team.get('memberIds').length;
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
		abTest = Object.keys(company.get('testGroups')).map(key => {
			return `${key}|${company.get('testGroups')[key]}`;
		});
	}

	const props = {
		userId,
		email,
		joinMethod,
		lastInviteType,
		userRegisteredAt,
		fullName,
		dateOfLastPost,
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
		abTest
	};
	return module.evalTemplateNoSend('identify_script', props);
};