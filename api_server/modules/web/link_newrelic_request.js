// handle the "GET /nr/:type" request to jump from NewRelic into CodeStream

'use strict';
const WebRequestBase = require('./web_request_base');
const { defaultCookieName, ides} = require('./config');

const TEMPLATE_BY_TYPE = {
	error: 'nr_error_inbox',
	code: 'nr_pixie'
};

class LinkNewRelicRequest extends WebRequestBase {
	async authorize () {
		this.isPublic = true;  
		return true; 
	}

	async checkAuthentication () {
		return true;
	}

	parsedPayload = {
		// errorGroupId (required, string): the guid of the error group
		// traceId (required, string): id of the instance of the error the user is looking at
		// src (required, string, value=NR-errorsinbox) used for tracking. Once the Open In IDE links are extended to other areas besides the Inbox, the src value should be modified accordingly (e.g., NR-APM, NR-Slack, etc.)  
		// entityId (required, string): entityId from this errorGroup
		
		// hash (optional, string, value=<hashOfRemote>) used for a better UX to open the last IDE based on a repo (this could also be some kind of unique identifier or guid that backs the remote)
		// commit (optional, string) git commit sha, full version
		// remote (optional, string) git remote url
		// tag (optional,  string) git tag
	};
	
	async process () {
		if (this.request.query && this.request.query.payload) {
			try {
		 		const parsedPayload = JSON.parse(Buffer.from(decodeURI(this.request.query.payload), 'base64').toString('ascii'));
			 	this.parsedPayload = {...parsedPayload};
			}
			catch(ex) {
				this.api.logger.warn(ex);
			}
		}
	 	await this.render();
	}
 
	async render () {
 		const templateProps = {			 
			launchIde: this.parsedPayload.ide === ''
					? 'default'
					: this.queryStringide,
 			queryString: {			 		 
				ide: this.parsedPayload.ide === ''
						? 'default'
						: this.parsedPayload.ide, 
			},			 
			icons: {},	
			// if we ever get a repoId pass it here		 
			partial_launcher_model: this.createLauncherModel(""),
			partial_title_model: { },
			segmentKey: this.api.config.telemetry.segment.webToken
		};

		const template = TEMPLATE_BY_TYPE[this.request.params.type.toLowerCase()];
		if (template) {
			await super.render(template, templateProps);
		} else {
			this.response.redirect('/web/404');
			this.responseHandled = true;
		}
	} 

	createLauncherModel (repoId) {
		// overwriting the base since the base deals with mongo data

		const cookieNames = [];
		if (repoId) {
			cookieNames.push(`${defaultCookieName}--${repoId}`);
		}
		cookieNames.push(defaultCookieName);
		const queryStringIDE = this.parsedPayload.ide;
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
			src: decodeURIComponent(this.parsedPayload.src || ''),		
			...lastOrigin
		};	 
		result.isDefaultJetBrains = result.lastOrigin && result.lastOrigin.moniker.indexOf('jb-') === 0; 
		return result;
	}
}

module.exports = LinkNewRelicRequest;
