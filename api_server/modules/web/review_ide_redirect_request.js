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
		this.templateProps.analyticsContentType = 'feedback_request';
		if (!this.templateProps.entityId) return false;
		else return true;
	}
}

module.exports = ReviewIdeRedirectRequest;
