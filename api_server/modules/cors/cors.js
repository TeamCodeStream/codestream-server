// provide a middleware function to handle CORS

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const CORS = require('cors');
const URL = require('url');

const _WHITELISTED_DOMAINS = [ 
	'undefined',    // 'undefined' and 'null' can come from our plugins, not sure why (and yes, they are strings)
	'null',
	'codestream.com',
	'codestream.us'
];

// parse domain out of url
const _parseDomain = url => {
	let parsed;
	try {
		parsed = URL.parse(url);
	}
	catch (error) {
		return url;
	}
	if (!parsed || !parsed.hostname) {
		return url;
	}
	const parts = parsed.hostname.split('.').reverse();
	if (parts.length > 1) {
		return `${parts[1]}.${parts[0]}`.toLowerCase();
	}
	else {
		return (parts[0] || url).toLowerCase();
	}
};

class CorsModule extends APIServerModule {

	getServiceOrigins () {
		return [
			this.api.config.slack.botOrigin,	// origin for Slack bot
			this.api.config.teams.botOrigin,    // origin for MS Teams bot
			this.api.config.webclient.host 		// origin for web app
		];
	}

	middlewares () {
		// return a middleware function to handle CORS considerations
		const corsOptions = {
			origin: (origin, callback) => {
				// no origin required if not from a browser
				if (!origin) {
					return callback(null, true);
				}

				// check against whitelisted domains
				const originDomain = _parseDomain(origin).toLowerCase();
				if (_WHITELISTED_DOMAINS.includes(originDomain)) {
					return callback(null, true);
				}

				// allow other codestream services to have their own origins
				const serviceOrigins = this.getServiceOrigins();
				for (let serviceOrigin of serviceOrigins) {
					const serviceOriginDomain = _parseDomain(serviceOrigin).toLowerCase();
					if (originDomain === serviceOriginDomain) {
						return callback(null, true);
					}
				}

				const error = `unrecognized origin ${origin}`;
				this.api.warn(error);
				return callback(new Error(error));
			}
		};
		return CORS(corsOptions);
	}
}

module.exports = CorsModule;
