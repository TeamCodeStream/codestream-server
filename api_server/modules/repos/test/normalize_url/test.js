var NormalizeURL = require('../../normalize_url');
var Assert = require('assert');

// make jshint happy
/* globals it */

var TestCases = [
	[ 'http://github.com/owner/path', 'github.com/owner/path' ],
	[ 'https://github.com/owner/path', 'github.com/owner/path' ],
	[ 'git://github.com/owner/path', 'github.com/owner/path' ],
	[ 'ssh://github.com/owner/path', 'github.com/owner/path' ],
	[ 'https://bitbucket.com/owner/path', 'bitbucket.com/owner/path' ],
	[ 'https://foo.bar.com/owner/path', 'foo.bar.com/owner/path' ],
	[ 'https://foo.bar.com/owner/path.git', 'foo.bar.com/owner/path' ],
	[ 'https://foo.BAR.com/OWNER/path.GIT', 'foo.bar.com/owner/path' ],
	[ 'https://foo.BAR.com/OWNER/path.x.GIT', 'foo.bar.com/owner/path.x' ],
	[ 'https://user@github.com/owner/path', 'github.com/owner/path' ],
	[ 'https://user@github.com/owner/path#x', 'github.com/owner/path' ],
	[ 'https://user@github.com/owner/path?x=a', 'github.com/owner/path' ],
	[ 'https://user@github.com/owner/path/to', 'github.com/owner/path/to' ],
	[ 'https://user@github.com/owner/path/to/repo', 'github.com/owner/path/to/repo' ],
	[ 'https://user@github.com/owner/path/to/repo.git', 'github.com/owner/path/to/repo' ],
	[ 'hTtPs://uSer@giTHub.cOm/oWnEr/pAth/To/REpo.GIt', 'github.com/owner/path/to/repo' ],
	[ 'user@github.com/owner/path.git', 'github.com/owner/path'],
	[ 'user@github.com/owner/path/to/repo.git', 'github.com/owner/path/to/repo'],
	[ 'USer@gITHub.coM/oWnER/pATh/TO/rEpo.GIT', 'github.com/owner/path/to/repo']
];

module.exports = function() {

	TestCases.forEach(
		(testCase) => {
			it(
				`"${testCase[0]}" should normalize to "${testCase[1]}"`,
				() => {
					let result = NormalizeURL(testCase[0]);
					Assert(result === testCase[1], `result should be "${testCase[1]}", was "${result}"`);
				}
			);
		}
	);
};
