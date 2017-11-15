'use strict';

var Assert = require('assert');

// make jshint happy
/* globals before, after, it */

class GenericTest {

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

	getExpectedError () {
		return null;
	}

	getExpectedFields () {
		return null;
	}

	checkResponse (error, response, callback) {
		this.error = error ? response : null;
		const expectError = this.getExpectedError();
		if (expectError) {
			this.expectError(expectError);
		}
		else if (error) {
			return callback(error);
		}
		else {
			this.response = response;
			this.expectFields();
			this.validate();
		}
		callback();
	}

	expectFields () {
		const expectFields = this.getExpectedFields();
		if (!expectFields) { return; }
		Assert(typeof this.response === 'object', 'response should be an object');
		this.expect(this.response, expectFields, '');
	}

	expect (responseData, expectData, chain) {
		const message = chain ? `response expects ${chain}` : 'response expected';
		if (this.isArrayOfStrings(expectData)) {
			Assert(typeof responseData === 'object', `${message} to be an object`);
			this.expectArray(responseData, expectData, chain);
		}
		else if (expectData instanceof Array) {
			Assert(responseData instanceof Array, `${message} to be an object`);
			this.expectArray(responseData, expectData, chain);
		}
		else if (typeof expectData === 'object') {
			Assert(typeof responseData === 'object', `${message} to be an object`);
			this.expectObject(responseData, expectData, chain);
		}
		else if (typeof expectData === 'string') {
			Assert(typeof responseData === 'string', `${message} to be a string`);
			Assert(responseData.match(new RegExp(expectData)), `${message} to be like ${expectData}`);
		}
	}

	isArrayOfStrings (value) {
		return value instanceof Array &&
			!value.find(elem => {
				return typeof elem !== 'string';
			});
	}

	expectArray (responseData, expectFields, chain) {
		Object.keys(expectFields).forEach(key => {
			const expect = expectFields[key];
			if (typeof expect === 'string') {
				Assert(typeof responseData[expect] !== 'undefined', `response requires ${chain}.${expect}`);
			}
			else if (typeof expect === 'object') {
				Assert(typeof responseData[key] === 'object', `response expects ${chain}.${key} to be an object`);
				this.expectObject(responseData[key], expect, `${chain}.${key}`);
			}
		});
	}

	expectObject (responseData, expectData, chain) {
		Object.keys(expectData).forEach(key => {
			Assert(typeof responseData[key] !== 'undefined', `response requires ${chain}.${key}`);
			this.expect(responseData[key], expectData[key], `${chain}.${key}`);
		});
	}

	validate () {
		if (typeof this.validateResponse !== 'function') { return; }
		this.validateResponse(this.response);
	}

	expectError (expectError) {
		Assert(this.error, 'test should return an error');
		this.expect(this.error, expectError, '');
	}

	validateMatchingObject (id, object, name) {
		Assert(id.toString() === object._id.toString(), `${name} doesn't match`);
	}

	validateMatchingObjects (objects1, objects2, name) {
		let objectIds_1 = objects1.map(object => object._id).sort();
		let objectIds_2 = objects2.map(object => object._id).sort();
		Assert.deepEqual(objectIds_2, objectIds_1, `${name} returned don't match`);
	}

	validateSortedMatchingObjects(objects1, objects2, name) {
		Assert.deepEqual(objects2, objects1, `${name} returned don't match`);
	}

	validateSanitized (object, unsanitizedAttributes) {
		let present = [];
		let objectAttributes = Object.keys(object);
		unsanitizedAttributes.forEach(attribute => {
			if (objectAttributes.indexOf(attribute) !== -1) {
				present.push(attribute);
			}
		});
		Assert(present.length === 0, 'these attributes are present and shouldn\'t be: ' + present.join(','));
	}

	validateSanitizedObjects (objects, unsanitizedAttributes) {
		objects.forEach(object => {
			this.validateSanitized(object, unsanitizedAttributes);
		});
	}
}

module.exports = GenericTest;
