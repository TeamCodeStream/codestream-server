'use strict';

/* eslint no-async-promise-executor: 0 */

module.exports = function(func, interval, logger, message) {
	return new Promise(async resolve => {
		let done = false;
		while (!done) {
			try {
				await func();
				done = true;
			}
			catch (error) {
				const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
				if (logger) {
					logger.warn(`${message}: ${errorMsg}`);
				}
				await new Promise(timeoutResolve => {
					setTimeout(timeoutResolve, interval);
				});
			}
		}
		resolve();
	});
};
	
	