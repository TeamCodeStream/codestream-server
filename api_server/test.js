// Master test script runner

'use strict';

// make eslint happy
/* globals before */

before(function (done) {
	if (process.argv.find((_) => _ === '--dev_secrets') !== undefined) {
		this.timeout(7000);
		const DevSecrets = require('@datanerd/codestream-utils').VaultSecrets;
		DevSecrets
			.fetchAllBaseVaultSecrets()
			.then((secretsEnv) => {
				console.log('Merging secrets...');
				Object.assign(process.env, secretsEnv);
				done();
			})
			.catch((e) => {
				console.error('Error reading secrets', e.message);
				done(e);
			});
	} else {
		done();
	}
});

require('./lib/test.js');
require('../shared/server_utils/test.js');
require('../shared/codestream_configs/test.js');
require('./modules/test.js');
