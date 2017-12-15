// somewhat sophisticated check against a set of input attributes that eliminates
// attributes we don't want or with types we don't want

'use strict';

// find an attribute within the allowed attributes, the allowed attributes can
// be a simple array of strings, or it can be an object with more specific constraints
// on what the attribute can be
var _findAttribute = function(allowedAttributes, attribute) {
	if (allowedAttributes instanceof Array) {
		// simple array of attribute names, meaning we don't really care what their type is
		return allowedAttributes.indexOf(attribute) !== -1;
	}
	else if (typeof allowedAttributes === 'object') {
		// each key of the allowed attributes is a type, and refers to an array of attributes that
		// can be that type
		let types = Object.keys(allowedAttributes);
		let index = types.findIndex(type => {
			return _findAttribute(allowedAttributes[type], attribute);
		});
		if (index !== -1) {
			return types[index];
		}
		else {
			return false;
		}
	}
};

// does the type of a provided attribute match the expected type?
var _typeMatches = function(value, type) {
	if (['object', 'string', 'number', 'boolean'].indexOf(type) !== -1) {
		// basic types
		return typeof value === type;
	}
	else if (type === 'array') {
		return value instanceof Array;
	}
	else if (type.startsWith('array')) {
		// allow an array of things, all of which are all the same type
		let match = type.match(/^array\((.+)\)$/);
		if (!match) {
			return false;
		}
		return value instanceof Array &&
			!value.find(elem => { return typeof elem !== match[1]; });
	}
	else {
		return false;
	}
};

// check every attribute of the passed object and see if it is "allowed"
// according to specification ... if it's not allowed, it's (quietly) deleted
module.exports = function(object, allowedAttributes) {
	if (typeof object !== 'object') { return; }
	Object.keys(object).forEach(attribute => {
		let type = _findAttribute(allowedAttributes, attribute);
		if (
			type !== true &&
			(
				type === false ||
				!_typeMatches(object[attribute], type)
			)
		) {
			delete object[attribute];
		}
	});
};
