'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyOpsByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying several operations to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const ops = [
			{
				'$set': {
					text: 'replaced!',
					newText: 'new text'
				},
				'$unset': {
					flag: true
				}
			},
			{
				'$push': {
					array: 9
				}
			},
			{
				'$push': {
					newArray: 1
				},
				'$pull': {
					array: 1
				},
			},
			{
				'$addToSet': {
					newArray: 2
				},
				'$set': {
					newText: 'new text replaced!'
				}
			}
		];
		this.data.test.applyOpsById(
			this.testDocument._id,
			ops,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, {
					text: 'replaced!',
					newText: 'new text replaced!',
					newArray: [1, 2]
				});
				delete this.testDocument.flag;
				this.testDocument.array.push(9);
				this.testDocument.array.splice(0, 1);
				callback();
			}
		);
	}
}

module.exports = ApplyOpsByIdTest;
