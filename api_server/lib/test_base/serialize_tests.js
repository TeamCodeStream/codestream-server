// provides a function to run one or more tests serially instead of preparing
// each in parallel

'use strict';

// make eslint happy
/* globals describe */

module.exports = function(tests) {
	tests.forEach(testClass => {
		const test = new testClass();
		describe(test.description, () => {
			test.test();
		});
	});
};
