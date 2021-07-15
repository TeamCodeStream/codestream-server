// handle the "GET /e" request to show a codemark

'use strict';
const WebRequestBase = require('./web_request_base');
const { ides} = require('./config');

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
			partial_launcher_model: this.createLauncherModel(""),
			partial_title_model: { },
			segmentKey: this.api.config.telemetry.segment.webToken
		};
		await super.render('nr_error_inbox', templateProps);
	} 

	createLauncherModel (repoId) {
		// overwriting the base since the base deals with mongo data
		let result = {		 
			ides: ides,
			src: decodeURIComponent(this.request.query.src || ''),		
			lastOrigin: ides.find(_ => _.moniker === "vsc") 
		};
		result.isDefaultJetBrains = result.lastOrigin && result.lastOrigin.moniker.indexOf('jb-') === 0;
		return result;
	}
}

module.exports = LinkNrErrorInboxRequest;
