'use strict';

var PutUserTest = require('./put_user_test');
var Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutUserTest {

	get description () {
		return `should not update ${this.otherAttribute} even if sent in the request`;
	}

    // form the data for the post update
	makePostData (callback) {
        super.makeUserData(() => {
            this.data[this.otherAttribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
            callback();
        });
	}

    // validate the response to the test request
	validateResponse (data) {
        let user = data.user;
        Assert(user[this.otherAttribute] === undefined, 'attribute appears in the response');
        super.validateResponse(data);
    }
}

module.exports = NoUpdateOtherAttributeTest;
