var URLNormalizer = require('./url_normalizer');
var Assert = require('assert');

// make jshint happy
/* globals describe, it */

var TestCases = [
	[ 'a', 'http://a' ],
	[ 'a.x', 'http://a.x' ],
	[ 'a.com', 'http://a.com' ],
	[ 'http://a', 'http://a' ],
	[ 'http://a.x', 'http://a.x' ],
	[ 'this://a', 'this://a' ],
	[ 'www.a', 'http://a'],
	[ 'www.a.com', 'http://a.com' ],
	[ 'a.b.c.d', 'http://a.b.c.d' ],
	[ '//a', 'http://a' ],
	[ '//a:80', 'http://a' ],
	[ 'http://a:80', 'http://a' ],
	[ 'http://a#b', 'http://a' ],
	[ 'http://a.com#b', 'http://a.com' ],
	[ 'https://a.com#b', 'https://a.com' ],
	[ 'http://www.a.com', 'http://a.com' ],
	[ 'http://ww.a.com', 'http://ww.a.com' ],
	[ 'a?b', 'http://a' ],
	[ 'a.com?b', 'http://a.com' ],
	[ 'http://a.com?b=1', 'http://a.com' ],
	[ 'https://a.com?b=1', 'https://a.com' ],
	[ 'a.co?b=1&c=2&d=3', 'http://a.co' ],
	[ 'a.com/x', 'http://a.com/x' ],
	[ 'a.com/x/y', 'http://a.com/x/y' ],
	[ 'a.com/x/y/', 'http://a.com/x/y' ],
	[ 'user@a.com', 'http://a.com' ],
	[ 'http://user@a.com', 'http://a.com' ],
	[ 'user@a.com:b/c/d', 'http://a.com/b/c/d'],
	[ 'http://user@a.com:b/c/d/?e=1&f=2#g', 'http://a.com/b/c/d' ],
	[ 'https://user@foo.com:path/to/something?this=that&a=b#frag', 'https://foo.com/path/to/something' ]
];

describe('url normalizer', function() {

	TestCases.forEach(
		(testCase) => {
			it(
				`"${testCase[0]}" should normalize to "${testCase[1]}"`,
				() => {
					let result = URLNormalizer(testCase[0]);
					Assert(result === testCase[1], `result should be "${testCase[1]}", was "${result}"`);
				}
			);
		}
	);

});
