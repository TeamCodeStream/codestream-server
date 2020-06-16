// provide a function to extract information from git URLs so they can be compared
// with high confidence for equality

'use strict';

const URL = require('url');
const GitUrlParse = require('git-url-parse');

module.exports = function(url) {
	// we are case-insensitive
	url = url.toLowerCase();

	// gitUrlParse doesn't handle urls without a protocol very well, so
	// just to get it to work, we'll add a protocol if needed
	const parsed = URL.parse(url);
	if (!parsed.protocol) {
		url = 'http://'+ url;
	}
	const info = GitUrlParse(url);
	// remove trailing .git as needed
	const gitMatch = info.pathname.match(/(.*)\.git$/);
	if (gitMatch) {
		info.pathname = gitMatch[1];
	}
	return `${info.resource}${info.pathname}`;
};
