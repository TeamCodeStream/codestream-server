'use strict';

let Async = require('async');

module.exports = {

	series (context, series, callback = null, bind_callback = false) {
		let bound_series = series.map(fn => fn.bind(context));
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.series(bound_series, bound_callback);
	},

	forEach (context, array, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.forEach(array, bound_iterator, bound_callback);
	},

	forEachSeries (context, array, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.forEachSeries(array, bound_iterator, bound_callback);
	},

	forEachLimit (context, array, limit, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.forEachLimit(array, limit, bound_iterator, bound_callback);
	},

	whilst (context, condition, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.whilst(condition, bound_iterator, bound_callback);
	},

	times (context, n, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.times(n, bound_iterator, bound_callback);
	},

	timesSeries (context, n, iterator, callback = null, bind_callback = false) {
		let bound_iterator = iterator.bind(context);
		let bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.timesSeries(n, bound_iterator, bound_callback);
	}
};
