// provide a function to extract information from git URLs so they can be compared
// with high confidence for equality

'use strict';

var URL = require('url');
var GitUrlParse = require('git-url-parse');

module.exports = function(url) {
	// we are case-insensitive
	url = url.toLowerCase();

	// gitUrlParse doesn't handle urls without a protocol very well, so
	// just to get it to work, we'll add a protocol if needed
	let parsed = URL.parse(url);
	if (!parsed.protocol) {
		url = 'http://'+ url;
	}
	let info = GitUrlParse(url);
	// remove trailing .git as needed
	let gitMatch = info.pathname.match(/(.*)\.git$/);
	if (gitMatch) {
		info.pathname = gitMatch[1];
	}
	return `${info.resource}${info.pathname}`;
};
