'use strict'

// make eslint happy
/* globals describe */

const Suite = require('./suite');

describe('running tests...', () => {
	(async function() {
		await Suite.run();
	})();
});
