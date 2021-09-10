'use strict';

const WebmailCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/webmail_companies');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

const _validateDomainJoining = function(domains) {
	const webmailDomains = ArrayUtilities.intersection(WebmailCompanies, domains);
	if (webmailDomains.length > 0) {
		return { domainJoining: `these domains are webmail and not allowed as joinable: ${webmailDomains}` };
	}
};

const _validateCodeHostJoining = function(hosts) {
	for (const host of hosts) {
		if (typeof host !== 'string' || !host) {
			return { codeHostJoining: 'invalid code host'};
		}
	}
};

module.exports = {

	validateAttributes: (attributes) => {
		// validate that none of the domains are webmail
		if (attributes.domainJoining) {
			attributes.domainJoining = attributes.domainJoining.map(domain => {
				return domain.toLowerCase().trim();
			});
			const error = _validateDomainJoining(attributes.domainJoining);
			if (error) {
				return error;
			}
		}

		// validate the code hosts
		if (attributes.codeHostJoining) {
			attributes.codeHostJoining = attributes.codeHostJoining.map(host => {
				return host.toLowerCase().trim();
			});
			const error = _validateCodeHostJoining(attributes.codeHostJoining);
			if (error) {
				return error;
			}
		}
	},

	validateDomainJoining: _validateDomainJoining,
	validateCodeHostJoining: _validateCodeHostJoining
};
