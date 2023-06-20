// handle opening a codemark in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');
const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');

class CodemarkIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		super.prepareTemplateProps();
		const teamId = this.getTeamId();
		this.templateProps.entityId = await this.getCodemarkId(teamId);
		this.templateProps.teamId = teamId;
		this.templateProps.pageType = 'codemark';
		this.templateProps.pageWhat = 'Codemark';
		this.templateProps.analyticsContentType = await this.getCodemarkType(this.templateProps.entityId);
		if (!this.templateProps.entityId || !this.templateProps.analyticsContentType) return false;
		else return true;
	}

	getTeamId () {
		return this.decodeLinkId(this.request.params.teamId);
	}

	async getCodemarkId (teamId) {
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLink = await this.data.codemarkLinks.getOneByQuery(
			{ teamId: teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (!codemarkLink) {
			this.warn('User requested a codemark link that was not found');
			return this.redirect404(this.teamId);
		}
		return codemarkLink.get('codemarkId');
	}

	async getCodemarkType (codemarkId) {
		const codemark = await this.data.codemarks.getById(codemarkId);
		if (!codemark) {
			this.warn(
				'User requested to link to a codemark but the codemark was not found'
			);
			return this.redirect404(this.teamId);
		}
		return codemark.get('type') === 'link' ? 'Permalink' : 'Codemark';
	}
}

module.exports = CodemarkIdeRedirectRequest;
