// provide a middleware function to handle CORS

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
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
		return url.toLowerCase();
	}
	if (!parsed || !parsed.hostname) {
		return url.toLowerCase();
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
			//this.api.config.webclient.host 	// origin for web app
		];
	}

	middlewares () {
		if (this.api.config.api.mockMode) {
			return [];
		}
		// return a middleware function to handle CORS considerations
		const corsOptions = {
			origin: (origin, callback) => {
				// no origin required if not from a browser
				if (!origin) {
					return callback(null, true);
				}

				// check against whitelisted domains
				const originDomain = _parseDomain(origin);
				if (_WHITELISTED_DOMAINS.includes(originDomain)) {
					return callback(null, true);
				}

				// check against the public api
				const publicDomain = _parseDomain(this.api.config.api.publicApiUrl || '');
				if (originDomain === publicDomain) {
					return callback(null, true);
				}

				// allow other codestream services to have their own origins
				const serviceOrigins = this.getServiceOrigins();
				for (let serviceOrigin of serviceOrigins) {
					const serviceOriginDomain = _parseDomain(serviceOrigin);
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
