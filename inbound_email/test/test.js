// unit tests concerning the inbound email server

'use strict';

const InboundEmailServerConfig = require(process.env.CSSVC_BACKEND_ROOT + '/inbound_email/config/config');
const EmailTest = require('./email_test');
const Async = require('async');
const EmailTests = require('./email_tests');

var Config;

// make eslint happy
/* globals describe, before, after, it */


const melog = function(msg) {
	console.log(`${Date.now()} - ${msg}`);
}

// we'll execute a series of tests, each of which plants a particular email file
// in the inbound emails directory and expects certain text in the post as a result,
// we'll listen for the post on a pubnub client. Alternatively, there are some
// tests where we expect processing the file to fail, and we expect no post as
// as result
describe('Inbound Email', function() {
	this.timeout(30000);

melog('GLOBAL DESCRIBE');
	before(async () => {
melog('In before, Config? ' + (Config ? 'y' : 'n'));
		Config = Config || await InboundEmailServerConfig.loadPreferredConfig();
melog('Config loaded');
melog('waiting 20000...');
		await new Promise(resolve => {
			setTimeout(() => {
melog('waited 20000');
				resolve();

			}, 20000);
		});
melog('Done with before');
	});

melog('SETTING UP TESTS...');
	Async.forEachSeries(
		EmailTests,
		(test, forEachCallback) => {
			// invoke an instance of the test class, define before callback,
			// and then define the actual test
			let emailTest = new EmailTest(test, Config);
melog(`Did set up test #${emailTest.testNum}`);
			describe(emailTest.description, () => {
melog(`Describing ${emailTest.testNum}...`);
				before(callback => {
melog(`Before test #${emailTest.testNum}`);
					emailTest.setConfig(Config);
					emailTest.before(callback);
				});
				after(emailTest.after.bind(emailTest));
				it(emailTest.it, itCallback => {
melog(`Running test #${emailTest.testNum}...`);
					emailTest.run(itCallback);
				});
			});
			forEachCallback();
		}
	);
});
