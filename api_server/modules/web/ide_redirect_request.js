// base class to handle various pages that redirect to the IDE

'use strict';
const WebRequestBase = require('./web_request_base');
const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');

class IdeRedirectRequest extends WebRequestBase {

	async authorize () {
		return true;
	}

	async checkAuthentication () {
		return true;
	}

	async process () {
		this.log('NROPENERROR: PROCESSING...');
		(await this.prepareTemplateProps()) && this.renderRedirect();
	}

	async prepareTemplateProps () {
		this.templateProps = {
			launchIde: this.request.query?.ide === ''
					? 'default'
					: this.request.query?.ide,
			queryString: {
				ide: this.request.query?.ide === ''
						? 'default'
						: this.request.query.ide,
			},
			icons: {},
			partial_launcher_model: this.createLauncherModel(''),
			partial_title_model: {},
			segmentKey: this.api.config.telemetry.segment.webToken,
			src: decodeURIComponent(this.request.query?.src || ''),
		}
		this.log('NROPENERROR: TEMPLATE PROPS:', JSON.stringify(this.templateProps, 0, 5));
	}

	getTeamId () {
		return this.decodeLinkId(this.request.params.teamId);
	}

	async getEntityId (teamId, key) {
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLink = await this.data.codemarkLinks.getOneByQuery(
			{ teamId: teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		)
		if (!codemarkLink) {
			this.warn('User requested a codemark link that was not found');
			return this.redirect404(this.teamId);
		}
		return codemarkLink.get(key);
	}

	renderRedirect () {
		super.render('ide_redirect', this.templateProps);
	}

	redirect404 (teamId) {
		let url = '/web/404';
		if (teamId) {
			url += `?teamId=${teamId}`;
		}
		this.response.redirect(url);
		this.responseHandled = true;
	}
}

module.exports = IdeRedirectRequest;
