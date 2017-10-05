'use strict';

var Async = require('async');

module.exports = {
	
	series (context, series, callback = null, bind_callback = false) {
		var bound_series = series.map(fn => fn.bind(context));
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.series(bound_series, bound_callback);
	},

	forEachSeries (context, array, iterator, callback = null, bind_callback = false) {
		var bound_iterator = iterator.bind(context);
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.forEachSeries(array, bound_iterator, bound_callback);		
	},

	forEachLimit (context, array, limit, iterator, callback = null, bind_callback = false) {
		var bound_iterator = iterator.bind(context);
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.forEachLimit(array, limit, bound_iterator, bound_callback);		
	},

	whilst (context, condition, iterator, callback = null, bind_callback = false) {
		var bound_iterator = iterator.bind(context);
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.whilst(condition, bound_iterator, bound_callback);
	},

	times (context, n, iterator, callback = null, bind_callback = false) {
		var bound_iterator = iterator.bind(context);
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.times(n, bound_iterator, bound_callback);		
	},

	timesSeries (context, n, iterator, callback = null, bind_callback = false) {
		var bound_iterator = iterator.bind(context);
		var bound_callback = bind_callback ? callback.bind(context) : callback;
		Async.timesSeries(n, bound_iterator, bound_callback);		
	}
};