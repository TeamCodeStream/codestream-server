// provide a function to extract information from git URLs so they can be compared
// with high confidence for equality

'use strict';

var GitUrlParse = require('git-url-parse');

module.exports = function(url) {
	// we are case-insensitive
	url = url.toLowerCase();

	let info = GitUrlParse(url);
	// remove trailing .git as needed
	let gitMatch = info.pathname.match(/(.*)\.git$/);
	if (gitMatch) {
		info.pathname = gitMatch[1];
	}
	return `${info.resource}${info.pathname}`;
};
