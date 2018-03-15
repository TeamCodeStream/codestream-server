'use strict';

var UpdateTest = require('./update_test');

class ApplyOpsByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying several operations to a document';
	}

	updateDocument (callback) {
		// apply a series of ops to a document, verify the operations result in the correct document in the end
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

	validateDocumentResponse() {
		this.response.newArray.sort(); // order not guaranteed
		super.validateDocumentResponse();
	}
}

module.exports = ApplyOpsByIdTest;
