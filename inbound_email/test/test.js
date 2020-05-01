// unit tests concerning the inbound email server

'use strict';

const InboundEmailServerConfig = require(process.env.CS_MAILIN_TOP + '/config/config');
const EmailTest = require('./email_test');
const Async = require('async');
const EmailTests = require('./email_tests');

var Config;

// make eslint happy
/* globals describe, before, after, it */


// we'll execute a series of tests, each of which plants a particular email file
// in the inbound emails directory and expects certain text in the post as a result,
// we'll listen for the post on a pubnub client. Alternatively, there are some
// tests where we expect processing the file to fail, and we expect no post as
// as result
describe('Inbound Email', function() {
	this.timeout(20000);

	before(async () => {
		Config = await InboundEmailServerConfig.loadConfig();
		await new Promise(resolve => {
			setTimeout(resolve, 10000);
		});
	});


	Async.forEachSeries(
		EmailTests,
		(test, forEachCallback) => {
			// invoke an instance of the test class, define before callback,
			// and then define the actual test
			let emailTest = new EmailTest(test);
			describe(emailTest.description, () => {
				emailTest.setConfig(Config);
				before(callback => {
					emailTest.setConfig(Config);
					emailTest.before(callback);
				});
				after(emailTest.after.bind(emailTest));

				it(emailTest.it, itCallback => {
					emailTest.run(itCallback);
				});
			});
			forEachCallback();
		}
	);
});
