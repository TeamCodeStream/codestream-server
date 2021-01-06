'use strict';

// Sort array of objects by properties within the objects

// https://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields

// sort_by() args are objects or field-names (as strings).
// For objects:
// {
// 	name: 'field-name',
// 	primer: function_to_use_to_prime_the_field,
// 	reverse: true || false,
// }

// Example:
// var homes = [
// 	{ h_id: '3', city: 'Dallas', state: 'TX', zip: '75201', price: '162500' },
// 	{ h_id: '4', city: 'Bevery Hills', state: 'CA', zip: '90210', price: '319250' },
// 	{ h_id: '6', city: 'Dallas', state: 'TX', zip: '75000', price: '556699' },
// 	{ h_id: '5', city: 'New York', state: 'NY', zip: '00010', price: '962500' },
// ];
//
// THIS SORTS THE LIST IN PLACE
// Each arg can be either a string (the name of the field to sort) or an object
// for the field if a reverse sort is desired, or it needs a primer
// homes.sort(sort_by('city', { name: 'price', primer: parseInt, reverse: true }));
// homes.sort(sort_by('h_id'));
// homes.sort(sort_by({ name: 'state' }, { name: 'h_id', reverse: true }));
// console.log(homes);


var sort_by;

(function () {
	// utility functions
	var default_cmp = function (a, b) {
			if (a == b) return 0;
			return a < b ? -1 : 1;
		},
		getCmpFunc = function (primer, reverse) {
			var dfc = default_cmp, // closer in scope
				cmp = default_cmp;
			if (primer) {
				cmp = function (a, b) {
					return dfc(primer(a), primer(b));
				};
			}
			if (reverse) {
				return function (a, b) {
					return -1 * cmp(a, b);
				};
			}
			return cmp;
		};

	// actual implementation
	sort_by = function () {
		var fields = [],
			n_fields = arguments.length,
			field,
			name,
			reverse,
			cmp;

		// preprocess sorting options
		for (var i = 0; i < n_fields; i++) {
			field = arguments[i];
			if (typeof field === 'string') {
				name = field;
				cmp = default_cmp;
			} else {
				name = field.name;
				cmp = getCmpFunc(field.primer, field.reverse);
			}
			fields.push({
				name: name,
				cmp: cmp,
			});
		}

		// final comparison function
		return function (A, B) {
			var a, b, name, result;
			for (var i = 0; i < n_fields; i++) {
				result = 0;
				field = fields[i];
				name = field.name;

				result = field.cmp(A[name], B[name]);
				if (result !== 0) break;
			}
			return result;
		};
	};
})();

module.exports = sort_by;
