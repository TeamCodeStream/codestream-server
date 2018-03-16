// provide a utility function to wrap a function that takes a callback with one
// that returns a promise

'use strict';

module.exports = function(fn, context, ...args) {
	return new Promise((resolve, reject) => {
		const callback = (error, result) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(result);
			}
		};
		const fnArgs = [...args, callback];
		fn.apply(context, fnArgs);
	});
};
