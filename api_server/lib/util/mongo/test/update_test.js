'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class UpdateTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			_id: this.testDocument._id,
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, update);
				callback();
			}
		);
	}
}

module.exports = UpdateTest;
