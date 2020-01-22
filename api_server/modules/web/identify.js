'use strict';

module.exports = function(options) {

	const { user, team, company, module } = options;
	let { provider } = options;
	if (provider === 'Microsoft Teams') {
		provider = 'MSTeams';
	}
	const userId = user && user.id;
	const email = user && user.get('email');
	const joinMethod = user && user.get('joinMethod');
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

	const props = {
		provider,
		userId,
		email,
		joinMethod,
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
		companyId
	};
	return module.evalTemplateNoSend('identify_script', props);
};