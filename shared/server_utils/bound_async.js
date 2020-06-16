// provides a set of functions wrapping some common functions from the async module
// afford the patters of specifying iterator functions without having to explicitly
// bind everything to the calling context, at the expense of a single this argument

'use strict';

let Async = require('async');

module.exports = {

	series (context, series, callback = null, bindCallback = false) {
		let boundSeries = series.map(fn => fn.bind(context));
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.series(boundSeries, boundCallback);
	},

	parallel (context, parallel, callback = null, bindCallback = false) {
		let boundParallel = parallel.map(fn => fn.bind(context));
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.parallel(boundParallel, boundCallback);
	},

	forEach (context, array, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.forEach(array, boundIterator, boundCallback);
	},

	forEachSeries (context, array, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.forEachSeries(array, boundIterator, boundCallback);
	},

	forEachLimit (context, array, limit, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.forEachLimit(array, limit, boundIterator, boundCallback);
	},

	whilst (context, condition, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.whilst(condition, boundIterator, boundCallback);
	},

	times (context, n, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.times(n, boundIterator, boundCallback);
	},

	timesSeries (context, n, iterator, callback = null, bindCallback = false) {
		let boundIterator = iterator.bind(context);
		let boundCallback = bindCallback ? callback.bind(context) : callback;
		Async.timesSeries(n, boundIterator, boundCallback);
	}
};
