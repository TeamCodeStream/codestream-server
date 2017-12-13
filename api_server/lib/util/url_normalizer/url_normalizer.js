// provide a function to normalize URLs so they can be compared with high confidence for equality

'use strict';

var NormalizeURL = require('normalize-url');

module.exports = function(url) {
	// we are case-insensitive
	url = url.toLowerCase();

	// first normalize according to https://www.npmjs.com/package/normalize-url
	url = NormalizeURL(
		url,
		{
			removeQueryParameters: [/^.+/] // remove them all!
		}
	);

	// look for username specifier (e.g. git@github.com) and remove it
	// at this point, git@github.com:teamcodestream/atom-plugin becomes http://git@github.com/:teamcodestream/atom-plugin
	// need to get rid of the 'git@' part, and the ':' before the path
	let match = url.match(/^http(s)?:\/\/(.+)@(.+)/);
	if (match && match.length >= 4) {
		// also look for a colon at the beginning of the path and remove it
		let colonMatch = match[3].match(/^(.+)\/:(.+)$/);
		if (colonMatch && colonMatch.length >= 3) {
			match[3] = `${colonMatch[1]}/${colonMatch[2]}`;
		}
		url = `http${match[1] || ''}://${match[3]}`;
	}

	return url;
};
