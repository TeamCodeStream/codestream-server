// provide functions for extracting the "company identifier" from a repo url
// the company identifier could be a known service with an org (eg. github.com/foo)
// or a domain (sub.foo.com becomes foo.com)

const KNOWN_GIT_SERVICES = {
	'github.com': 'GitHub',
	'bitbucket.org': 'BitBucket',
	'gitlab.com': 'GitLab'
};

// check if the url is associated with a known service, like github, and if
// so, parse and extract contents
const _extractKnownService = function(url) {
	let service, org;
	if (Object.keys(KNOWN_GIT_SERVICES).find(knownService => {
		const escapedService = knownService.replace('.', '\\.');
		const regExp = new RegExp(`^${escapedService}/(.+?)/`);
		const match = url.match(regExp);
		if (match && match.length > 1) {
			service = knownService;
			org = match[1];
			return true;
		}
	})) {
		return { service, org };
	}
};

// extract the domain part of the url, ignoring qualifiers to the domain
const _extractDomain = function(url) {
	const match = url.match(/^(.+?)\//);
	if (match && match.length > 1) {
		const domainParts = match[1].split('.');
		return { domain:  domainParts.slice(-2).join('.') };
	}
};

// extract the company identifier, either a known service and org like github.com/org,
// or an unqualified domain
const _extractCompanyIdentifier = function(url) {
	return _extractKnownService(url) || _extractDomain(url);
};

// form the company identifier string from the company identifier object
const _formCompanyIdentifier = function(identifier) {
	if (identifier && identifier.service) {
		return `${identifier.service}/${identifier.org}`;
	}
	else if (identifier && identifier.domain) {
		return identifier.domain;
	}
};

module.exports = {

	KNOWN_GIT_SERVICES,

	extractKnownService: _extractKnownService,

	extractDomain: _extractDomain,

	extractCompanyIdentifier: _extractCompanyIdentifier,

	formCompanyIdentifier: _formCompanyIdentifier,

	getCompanyIdentifier (url) {
		const identifier = _extractCompanyIdentifier(url);
		return _formCompanyIdentifier(identifier);
	}
};
