// series of test cases for testing which ide to choose

'use strict';

var WebRequestBase = require('../web_request_base');
var Assert = require('assert');

// make eslint happy
/* globals it */

// https://github.com/Microsoft/vscode-recipes/tree/master/debugging-mocha-tests

// for each test case, we expect to get the expected moniker
[
	{ expected: 'vsc', expectedAutoOpen: false, title: 'should get default IDE (vsc)' },
	{ expected: 'vsc', expectedAutoOpen: false, cookies: { 'cs__ide-mru': 'unknown' }, title: 'should get default IDE, bad cookie'  },
	{ expected: 'vsc', expectedAutoOpen: false, cookies: { 'cs__ide-mru--123': 'unknown' },  title: 'should get default IDE, bad cookie with repo' },
	{ expected: 'vsc-insiders', expectedAutoOpen: true, cookies: { 'cs__ide-mru--456': 'vsc-insiders' }, repoId: '456',  title: 'should get cookied repo IDE' },

	{ expected: 'jb-idea', expectedAutoOpen: true, cookies: { 'cs__ide-mru': 'jb-idea' }, title: 'should get cookied IDE' },
	{ expected: 'jb-idea', expectedAutoOpen: true, cookies: { 'cs__ide-mru--123': 'jb-idea' }, repoId: '123', title: 'should get cookied repo IDE' },
	
	{ expected: 'jb-idea', expectedAutoOpen: true, cookies: { 'cs__ide-mru--123': 'jb-idea', 'cs__ide-mru--456': 'jb-idea', 'cs__ide-mru': 'jb-idea' }, repoId: '789', title: 'should get default IDE (has other cookies)'  },

	{ expected: 'vsc', expectedAutoOpen: true, users: [{ lastOrigin: 'VS Code' }], title: 'should get lastOrigin IDE' },
	{ expected: 'vsc-insiders', expectedAutoOpen: true, users: [{ lastOrigin: 'VS Code', lastOriginDetail: 'Visual Studio Code - Insiders' }], title: 'should get lastOriginDetail IDE' },
	{ expected: 'jb-studio', expectedAutoOpen: true, users: [{ lastOrigin: 'JetBrains', lastOriginDetail: 'Android Studio' }], title: 'should get lastOriginDetail IDE (JetBrains)'  },

	//{ expected: 'atom', expectedAutoOpen: true, users: [{ lastOrigin: 'Atom', lastOriginDetail: 'Atom (dev)' }], title: 'should get lastOriginDetail IDE (Atom doesn\'t use detail)'  },

	{ expected: 'vs', expectedAutoOpen: true, users: [{ lastOrigin: 'VS', lastOriginDetail: 'Visual Studio Community 2019' }], title: 'should get lastOriginDetail IDE (VS doesn\'t use detail)'  },

	{ expected: 'vsc-insiders', expectedAutoOpen: false, users: [undefined, { lastOrigin: 'VS Code', lastOriginDetail: 'Visual Studio Code - Insiders' }], title: 'should get lastOriginDetail from creator'  },

	{ expected: 'vs', expectedAutoOpen: true, cookies: { 'cs__ide-mru': 'jb-idea' }, query: {ide: 'vs' }, title: 'should use queryString ide, not cookied version'  },
].forEach(
	(testCase) => {
		it(
			`${testCase.title}`,
			() => {
				
				var webrequestBase = new WebRequestBase({
					request: {
						query: testCase.query ? testCase.query : { ide: ''},
						cookies: testCase.cookies
					}
				});
				
				const result = webrequestBase.getLastIde(testCase.repoId, testCase.users);
				Assert(result.lastOrigin.moniker === testCase.expected, `moniker result should be ${testCase.expected}, was ${result.moniker}`);

				if (testCase.expectedAutoOpen != null) {
					Assert(result.autoOpen === testCase.expectedAutoOpen, `autoOpen result should be ${testCase.expectedAutoOpen}, was ${result.autoOpen}`);
				}
			}
		);
	}
);
