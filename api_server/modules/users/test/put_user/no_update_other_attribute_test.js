'use strict';

const PutUserTest = require('./put_user_test');
const Assert = require('assert');
const ObjectId = require('mongodb').ObjectId;
const RandomString = require('randomstring');

class NoUpdateOtherAttributeTest extends PutUserTest {

	get description () {
		return `should not update ${this.otherAttribute} even if sent in the request to update a user`;
	}

	// form the data for the post update
	makeUserData (callback) {
		super.makeUserData(() => {
			let otherAttributeValue;
			switch (this.otherAttributeType) {
			default:
			case 'string': 
			case 'email': 
			case 'username':
				otherAttributeValue = RandomString.generate(10); 
				break;
			case 'id':
				otherAttributeValue = ObjectId();
				break;
			case 'object': 
				otherAttributeValue = { x: 1, y: 'two' }; 
				break;
			case 'arrayOfIds':
				otherAttributeValue = [ObjectId(), ObjectId()];
				break;
			case 'arrayOfEmails':
			case 'arrayOfStrings':
				otherAttributeValue = ['x', 'y'];
				break;
			case 'boolean':
				otherAttributeValue = true;
				break;
			case 'number':
			case 'timestamp':
				otherAttributeValue = Date.now();
				break;
			}
			this.data[this.otherAttribute] = otherAttributeValue;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const setData = data.user.$set;
		Assert(setData[this.otherAttribute] === undefined, 'attribute appears in the response');
		delete this.data[this.otherAttribute];
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
