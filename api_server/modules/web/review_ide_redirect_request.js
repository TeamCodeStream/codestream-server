// handle opening a feedback request in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');

class ReviewIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		super.prepareTemplateProps();
		const teamId = this.getTeamId();
		this.templateProps.entityId = await this.getEntityId(teamId, 'reviewId');
		this.templateProps.teamId = teamId;
		this.templateProps.pageType = 'review';
		this.templateProps.pageWhat = 'Review';
		this.templateProps.analyticsContentType = 'Feedback Request';
		if (!this.templateProps.entityId) return false;
	}
}

module.exports = ReviewIdeRedirectRequest;
