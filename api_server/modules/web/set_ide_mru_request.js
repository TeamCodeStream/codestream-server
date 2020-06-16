// handles the POST request to create an ide MRU cookie
'use strict';

const WebRequestBase = require('./web_request_base');
const URL = require('url');
const { defaultCookieName } = require('./config');

class SetIdeMruRequest extends WebRequestBase {

	constructor (options) {
		super(options);
	}

	async authorize () {
		// anyone can access this
	}

	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['ide']
				},
				optional: {
					string: ['repoId']
				}
			}
		);
	}

	async process () {
		await this.requireAndAllow();

		let { ide, repoId } = this.request.body;
		ide = decodeURIComponent(ide || '');
		if (!ide) {
			this.warn('No ide found in request');
			return;
		}
		repoId = decodeURIComponent(repoId || '');

		const twentyYears = 20 * 365 * 24 * 60 * 60 * 1000;		

		// create 1 or 2 cookies...
		// if there's a repoId, set the repo-specific cookie
		// AND if we don't have that non-repo oriented one, set
		// that one too

		const cookieName = repoId ? `${defaultCookieName}--${repoId}` : defaultCookieName;
		const uri = URL.parse(this.request.api.config.api.publicApiUrl);
		const cookieDomain = this.getDomain(uri);
		const cookieData = {
			secure: true,
			httpOnly: true,
			// WTF can't read this when enabled
			// sameSite: 'Strict',
			expires: new Date(Date.now() + twentyYears)
		};
		if (cookieName === defaultCookieName) {
			// use the non sub-domained version
			cookieData.domain = `.${cookieDomain || uri.hostname}`;
		}
		this.response.cookie(cookieName, ide, cookieData);

		// if we haven't ever set a non-repo oriented cookie, and this isn't that, set it now
		if (cookieName !== defaultCookieName && !this.request.cookies[defaultCookieName]) {
			cookieData.domain = `.${cookieDomain || uri.hostname}`;		
			this.response.cookie(defaultCookieName, ide, cookieData);
		}
	}

	/**
	 * Returns just the domain part of a host (accounts for sub-domains as well)
	 *
	 * @param {*} uri
	 * @returns domain string
	 * @memberof SetIdeMruRequest
	 */
	getDomain (uri) {
		try {
			const hostName = uri.hostname;
			if (hostName) {
				var parts = hostName.split('.').reverse();
				if (parts) {
					if (parts.length > 2) {
						return parts[1] + '.' + parts[0];
					}
					else {
						return hostName;
					}
				}
			}			
		} catch (ex) {
			return undefined;
		}
		return undefined;
	}
}

module.exports = SetIdeMruRequest;
