'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Update_Test extends Get_By_Id_Test {

	get_description () {
		return 'should get the correctly updated document after updating a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		var update = {
			_id: this.test_document._id,
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_document, update);
				callback();
			}
		);
	}
}

module.exports = Update_Test;
