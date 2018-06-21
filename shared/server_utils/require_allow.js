// somewhat sophisticated check against a set of input attributes that eliminates
// attributes we don't want or with types we don't want

'use strict';

// find an attribute within the checked attributes, the checked attributes can
// be a simple array of strings, or it can be an object with more specific constraints
// on what the attribute can be
var _findAttribute = function(checkAttributes, attribute) {
	if (checkAttributes instanceof Array) {
		// simple array of attribute names, meaning we don't really care what their type is
		return checkAttributes.includes(attribute);
	}
	else if (typeof checkAttributes === 'object') {
		// each key of the checked attributes is a type, and refers to an array of attributes that
		// can be that type
		let types = Object.keys(checkAttributes);
		let index = types.findIndex(type => {
			return _findAttribute(checkAttributes[type], attribute);
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
	if (['object', 'string', 'number', 'boolean'].includes(type)) {
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
			value.findIndex(elem => {
				return typeof elem !== match[1];
			}) === -1;
	}
	else {
		return false;
	}
};

// check that every required attribute exists in the passed object and
// (optionally) if it matches the type expected
const _require = function(object, requiredAttributes) {
	if (typeof object !== 'object') { return; }
	if (typeof requiredAttributes !== 'object') { return; }
	let missing = [];
	let invalid = [];
	Object.keys(requiredAttributes).forEach(type => {
		let attributes = requiredAttributes[type];
		if (!(attributes instanceof Array)) { return; }
		attributes.forEach(attribute => {
			if (typeof object[attribute] === 'undefined') {
				missing.push(attribute);
			}
			else if (!_typeMatches(object[attribute], type)) {
				invalid.push(attribute);
			}
		});
	});
	if (missing.length === 0 && invalid.length === 0) {
		return null;
	}
	else {
		return { missing, invalid };
	}
};

// check every attribute of the passed object and see if it is "allowed"
// according to specification ... if it's not allowed, it's (quietly) deleted
var _allow = function(object, allowedAttributes, options = {}) {
	if (typeof object !== 'object') { return; }
	let deleted = [];
	let invalid = [];
	Object.keys(object).forEach(attribute => {
		let type = _findAttribute(allowedAttributes, attribute);
		if (
			type !== true &&
			(
				type === false ||
				!_typeMatches(object[attribute], type)
			)
		) {
			if (options.strict) {
				invalid.push(attribute);
			}
			else {
				delete object[attribute];
				deleted.push(attribute);
			}
		}
	});
	if (invalid.length !== 0) {
		return { invalid };
	}
	else if (deleted.length !== 0) {
		return { deleted };
	}
	else {
		return null;
	}
};

module.exports = {

	// require certain attributes
	require: _require,

	// allow only certain attributes
	allow: _allow,

	// allow and require certain attributes
	requireAllow: function(object, requiredAndOptionalAttributes, options = {}) {
		// required attributes are allowed, so they automatically become part
		// of the allowed attributes we check
		let allowed = {};
		Object.keys(requiredAndOptionalAttributes.required || {}).forEach(type => {
			allowed[type] = (allowed[type] || []).concat(requiredAndOptionalAttributes.required[type]);
		});
		Object.keys(requiredAndOptionalAttributes.optional || {}).forEach(type => {
			allowed[type] = (allowed[type] || []).concat(requiredAndOptionalAttributes.optional[type]);
		});
		let info = _require(object, requiredAndOptionalAttributes.required, options);
		if (info) {
			return info;
		}
		else {
			return _allow(object, allowed, options);
		}
	}
};
