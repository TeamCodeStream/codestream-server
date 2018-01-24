'use strict';

var PutUserTest = require('./put_user_test');

class UpdateMeTest extends PutUserTest {

    constructor (options) {
        super(options);
        this.id = 'me';
    }

	get description () {
        return `should return the updated user when updating ${this.attributes.join(' and ')} for me`;
	}
}

module.exports = UpdateMeTest;
