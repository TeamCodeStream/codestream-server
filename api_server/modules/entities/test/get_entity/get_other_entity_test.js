'use strict';

const GetEntityTest = require('./get_entity_test');

class GetOtherEntityTest extends GetEntityTest {

	constructor (options) {
		super(options);
		this.teamCreatorCreatesEntity = true;
	}

	get description () {
		return 'should return a valid entity when requesting an entity created by another user on a team that i am on';
	}
}

module.exports = GetOtherEntityTest;
