'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebAuthCompleteRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		if (this.request.query.userId) {
			this.user = await this.data.users.getById(this.request.query.userId.toLowerCase());
		}
		if (this.request.query.teamId) {
			this.team = await this.data.teams.getById(this.request.query.teamId.toLowerCase());
			if (this.team.get('companyId')) {
				this.company = await this.data.companies.getById(this.team.get('companyId'));
			}
		}

		const segmentKey = this.api.config.segment.webToken;
		const provider = this.request.query.provider || 'CodeStream';
		const userId = this.user && this.user.id;
		const haveUser = !!userId;
		const email = this.user && this.user.get('email');
		const joinMethod = this.user && this.user.get('joinMethod');
		const userRegisteredAt = this.user && new Date(this.user.get('registeredAt')).toISOString();
		const fullName = this.user && this.user.get('fullName');
		const dateOfLastPost = this.user && this.user.get('lastPostCreatedAt') &&
			new Date(this.user.get('lastPostCreatedAt')).toISOString();
		const teamId = this.team && this.team.id;
		const teamName = this.team && this.team.get('name');
		const teamSize = this.team && this.team.get('memberIds').length;
		const companyName = this.company && this.company.get('name');

		this.module.evalTemplate(this, 'auth_complete', {
			segmentKey,
			provider,
			haveUser,
			userId,
			email,
			joinMethod,
			userRegisteredAt,
			fullName,
			dateOfLastPost,
			teamId,
			teamName,
			teamSize,
			companyName,
			finishUrl: decodeURIComponent(this.request.query.finishUrl)
		});
	}
}

module.exports = WebAuthCompleteRequest;
