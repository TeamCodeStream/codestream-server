// handle the "GET /e" request to show a codemark

'use strict';
const WebRequestBase = require('./web_request_base');
const { defaultCookieName, ides} = require('./config');

class LinkNrErrorInboxRequest extends WebRequestBase {
	async authorize () {
		this.isPublic = true;  
		return true; 
	}

	async checkAuthentication () {
		return true;
	}

	async process () {
	 	 await this.render();
	}
 
	async render () {
 		const templateProps = {			 
			launchIde: this.request.query.ide === ''
					? 'default'
					: this.request.query.ide,
			queryStringFull: JSON.stringify(this.request.query),	 
			queryString: {			 		 
				ide: this.request.query.ide === ''
						? 'default'
						: this.request.query.ide, 
			},			 
			icons: {},	
			// if we ever get a repoId pass it here		 
			partial_launcher_model: this.createLauncherModel(""),
			partial_title_model: { },
			segmentKey: this.api.config.telemetry.segment.webToken
		};
		await super.render('nr_error_inbox', templateProps);
	} 

	createLauncherModel (repoId) {
		// overwriting the base since the base deals with mongo data

		const cookieNames = [];
		if (repoId) {
			cookieNames.push(`${defaultCookieName}--${repoId}`);
		}
		cookieNames.push(defaultCookieName);
		const queryStringIDE = this.request.query && this.request.query.ide;
		let autoOpen = !!(!queryStringIDE || queryStringIDE === 'default');
		const lastOrigin = ((function() {
			for (const cookieName of cookieNames) {
				const cookie = this.request.cookies && this.request.cookies[cookieName];
				if (cookie) {
					const mappedIde = ides.find(_ => _.moniker === cookie);
					if (mappedIde) {
						return { lastOrigin: mappedIde, autoOpen: autoOpen, isMru: true };
					}
				}
			}
			return {
				lastOrigin: ides.find(_ => _.moniker === "vsc"),
				autoOpen: false,
				isMru: false
			}
		}).bind(this))();
		const result = {		 
			ides: ides,
			csrf: this.request.csrfToken(),
			src: decodeURIComponent(this.request.query.src || ''),		
			...lastOrigin
		};	 
		result.isDefaultJetBrains = result.lastOrigin && result.lastOrigin.moniker.indexOf('jb-') === 0; 
		return result;
	}
}

module.exports = LinkNrErrorInboxRequest;
