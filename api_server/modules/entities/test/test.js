// handle unit tests for the entities module

'use strict';

// make eslint happy
/* globals describe */

const GetEntityRequestTester = require('./get_entity/test');
const GetEntitiesRequestTester = require('./get_entities/test');
const PostEntityRequestTester = require('./post_entity/test');

describe('entity requests', function() {

	describe('GET /entities/:id', GetEntityRequestTester.test);
	describe('GET /entities', GetEntitiesRequestTester.test);
	describe('POST /entities', PostEntityRequestTester.test);
});
