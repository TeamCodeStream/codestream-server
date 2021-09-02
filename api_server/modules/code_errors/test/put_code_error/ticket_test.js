'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const RandomString = require('randomstring');

class TicketTest extends PutCodeErrorTest {

	get description () {
		return 'should update ticket and pull request attributes when requested';
	}

	makeCodeErrorUpdateData (callback) {
		super.makeCodeErrorUpdateData(error => {
			if (error) { return callback(error); }
			const newData = {
				ticketUrl: `https://trello.com/${RandomString.generate(10)}/${RandomString.generate(10)}`,
				ticketProviderId: 'trello*com'
			};
			Object.assign(this.data, newData);
			Object.assign(this.expectedData.codeError.$set, newData);
			callback();
		});
	}
}

module.exports = TicketTest;
