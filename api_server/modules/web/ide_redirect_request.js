// base class to handle various pages that redirect to the IDE

'use strict';
const WebRequestBase = require('./web_request_base');

class IdeRedirectRequest extends WebRequestBase {

	async authorize () {
		return true;
	}

	async checkAuthentication () {
		return true;
	}

	async process () {
		(await this.prepareTemplateProps()) && this.renderRedirect();
	}

	async prepareTemplateProps () {
		this.templateProps = {
			launchIde: this.request.query.ide === ''
					? 'default'
					: this.request.query.ide,
			queryString: {
				ide: this.request.query.ide === ''
						? 'default'
						: this.request.query.ide,
			},
			icons: {},
			partial_launcher_model: this.createLauncherModel(''),
			partial_title_model: {},
			segmentKey: this.api.config.telemetry.segment.webToken,
			src: decodeURIComponent(this.request.query.src || ''),
		}
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
