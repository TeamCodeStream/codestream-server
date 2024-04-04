// base class to handle various pages that redirect to the IDE

'use strict';
const WebRequestBase = require('./web_request_base');
//const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');

class IdeRedirectRequest extends WebRequestBase {

	async authorize () {
		return true;
	}

	async checkAuthentication () {
		return true;
	}

	async process () {
		await this.prepareTemplateProps();
		await this.renderRedirect();
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
			src: decodeURIComponent(this.request.query?.src || ''),
			csrf: this.request.csrfToken(),
		}
	}

	async renderRedirect () {
		return super.render('ide_redirect', this.templateProps);
	}

	redirect404 (teamId) {
		this.response.redirect('/web/404');
		this.responseHandled = true;
	}
}

module.exports = IdeRedirectRequest;
