// handle opening a code error in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');
const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');

class CodeErrorIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		super.prepareTemplateProps();
		const teamId = this.getTeamId();
		this.templateProps.entityId = await this.getCodeErrorId(teamId);
		this.templateProps.teamId = teamId;
		this.templateProps.pageType = 'codeerror';
		this.templateProps.pageWhat = 'CodeError';
		this.templateProps.analyticsContentType = 'Error';
		if (!this.templateProps.entityId) return false;
		else return true;
	}

	getTeamId () {
		return this.decodeLinkId(this.request.params.teamId);
	}

	async getCodeErrorId (teamId) {
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLink = await this.data.codemarkLinks.getOneByQuery(
			{ teamId: teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (!codemarkLink) {
			this.warn('User requested a codemark link that was not found');
			return this.redirect404(this.teamId);
		}
		return codemarkLink.get('codeErrorId');
	}
}

module.exports = CodeErrorIdeRedirectRequest;
