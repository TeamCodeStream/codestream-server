'use strict';

var UpdateToCacheTest = require('./update_to_cache_test');

class ApplyAddToCacheTest extends UpdateToCacheTest {

	get description () {
		return 'should get the correct model after applying an add update to a cached model';
	}

	async updateTestModel (callback) {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		this.expectedOp = {
			'$addToSet': update 
		};
		try {
			this.actualOp = await this.data.test.applyOpById(
				this.testModel.id,
				this.expectedOp
			);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.attributes.array.push(7);
		callback();
	}
}

module.exports = ApplyAddToCacheTest;
