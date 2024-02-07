// handle opening a code error in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');

class CodeErrorIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		super.prepareTemplateProps();
		const teamId = this.getTeamId();
		this.templateProps.entityId = await this.getEntityId(teamId, 'codeErrorId');
		this.templateProps.teamId = teamId;
		this.templateProps.pageType = 'codeerror';
		this.templateProps.pageWhat = 'CodeError';
		this.templateProps.analyticsContentType = 'error';
		if (!this.templateProps.entityId) return false;
		else return true;
	}
}

module.exports = CodeErrorIdeRedirectRequest;
