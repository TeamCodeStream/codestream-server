'use strict';

module.exports = function(options) {

	const { provider, user, team, company, module } = options;
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
	const companyName = company && company.get('name');

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
		companyName
	};
	return module.evalTemplateNoSend('identify_script', props);
};