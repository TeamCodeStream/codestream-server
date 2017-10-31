'use strict';

var Assert = require('assert');

// make jshint happy
/* globals before, after, it */

class Generic_Test {

	constructor (options) {
		Object.assign(this, options);
	}

	run (callback) {
		callback(null, {});
	}

	before (callback) {
		callback();
	}

	after (callback) {
		callback();
	}

	test () {

		if (typeof this.authenticate === 'function') {
			before((callback) => {
				this.authenticate(callback);
			});
		}

		before((callback) => {
			this.before(callback);
		});

		after((callback) => {
			this.after(callback);
		});

		it(
			this.description || '???',
			(callback) => {
				this.run(callback);
			}
		);
	}

	get_expected_error () {
		return null;
	}

	get_expected_fields () {
		return null;
	}

	check_response (error, response, callback) {
		this.error = error ? response : null;
		const expect_error = this.get_expected_error();
		if (expect_error) {
			this.expect_error(expect_error);
		}
		else if (error) {
			return callback(error);
		}
		else {
			this.response = response;
			this.expect_fields();
			this.validate();
		}
		callback();
	}

	expect_fields () {
		const expect_fields = this.get_expected_fields();
		if (!expect_fields) { return; }
		Assert(typeof this.response === 'object', 'response should be an object');
		this.expect(this.response, expect_fields, '');
	}

	expect (response_data, expect_data, chain) {
		const message = chain ? `response expects ${chain}` : 'response expected';
		if (this.is_array_of_strings(expect_data)) {
			Assert(typeof response_data === 'object', `${message} to be an object`);
			this.expect_array(response_data, expect_data, chain);
		}
		else if (expect_data instanceof Array) {
			Assert(response_data instanceof Array, `${message} to be an object`);
			this.expect_array(response_data, expect_data, chain);
		}
		else if (typeof expect_data === 'object') {
			Assert(typeof response_data === 'object', `${message} to be an object`);
			this.expect_object(response_data, expect_data, chain);
		}
		else if (typeof expect_data === 'string') {
			Assert(typeof response_data === 'string', `${message} to be a string`);
			Assert(response_data.match(new RegExp(expect_data)), `${message} to be like ${expect_data}`);
		}
	}

	is_array_of_strings (value) {
		return value instanceof Array &&
			!value.find(elem => {
				return typeof elem !== 'string';
			});
	}

	expect_array (response_data, expect_fields, chain) {
		Object.keys(expect_fields).forEach(key => {
			const expect = expect_fields[key];
			if (typeof expect === 'string') {
				Assert(typeof response_data[expect] !== 'undefined', `response requires ${chain}.${expect}`);
			}
			else if (typeof expect === 'object') {
				Assert(typeof response_data[key] === 'object', `response expects ${chain}.${key} to be an object`);
				this.expect_object(response_data[key], expect, `${chain}.${key}`);
			}
		});
	}

	expect_object (response_data, expect_data, chain) {
		Object.keys(expect_data).forEach(key => {
			Assert(typeof response_data[key] !== 'undefined', `response requires ${chain}.${key}`);
			this.expect(response_data[key], expect_data[key], `${chain}.${key}`);
		});
	}

	validate () {
		if (typeof this.validate_response !== 'function') { return; }
		this.validate_response(this.response);
	}

	expect_error (expect_error) {
		Assert(this.error, 'test should return an error');
		this.expect(this.error, expect_error, '');
	}

	validate_matching_object (id, object, name) {
		Assert(id.toString() === object._id.toString(), `${name} doesn't match`);
	}

	validate_matching_objects (objects_1, objects_2, name) {
		let object_ids_1 = objects_1.map(object => object._id).sort();
		let object_ids_2 = objects_2.map(object => object._id).sort();
		Assert.deepEqual(object_ids_2, object_ids_1, `${name} returned don't match`);
	}

	validate_sorted_matching_objects(objects_1, objects_2, name) {
		Assert.deepEqual(objects_2, objects_1, `${name} returned don't match`);
	}

	validate_sanitized (object, unsanitized_attributes) {
		let present = [];
		let object_attributes = Object.keys(object);
		unsanitized_attributes.forEach(attribute => {
			if (object_attributes.indexOf(attribute) !== -1) {
				present.push(attribute);
			}
		});
		Assert(present.length === 0, 'these attributes are present and shouldn\'t be: ' + present.join(','));
	}

	validate_sanitized_objects (objects, unsanitized_attributes) {
		objects.forEach(object => {
			this.validate_sanitized(object, unsanitized_attributes);
		});
	}
}

module.exports = Generic_Test;
