// handle opening a codemark in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');

class CodemarkIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		super.prepareTemplateProps();
		const teamId = this.getTeamId();
		this.templateProps.entityId = await this.getEntityId(teamId, 'codemarkId');
		this.templateProps.teamId = teamId;
		this.templateProps.pageType = 'codemark';
		this.templateProps.pageWhat = 'Codemark';
		this.templateProps.analyticsContentType = await this.getCodemarkType(this.templateProps.entityId);
		if (!this.templateProps.entityId || !this.templateProps.analyticsContentType) return false;
		else return true;
	}

	async getCodemarkType (codemarkId) {
		const codemark = await this.data.codemarks.getById(codemarkId);
		if (!codemark) {
			this.warn(
				'User requested to link to a codemark but the codemark was not found'
			);
			return this.redirect404(this.teamId);
		}
		return codemark.get('type') === 'link' ? 'permalink' : 'codemark';
	}
}

module.exports = CodemarkIdeRedirectRequest;
