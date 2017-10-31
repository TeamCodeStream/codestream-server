'use strict';

var PubNub_Test = require('./pubnub_test');
var No_Access_Test = require('./no_access_test');
var Revoke_Access_Test = require('./revoke_access_test');
var Unsubscribe_Test = require('./unsubscribe_test');

// make jshint happy
/* globals describe */

/* jshint -W071 */

global.X = 1;

describe('pubnub', function() {

	this.timeout(10000);

	new PubNub_Test().test();
	new No_Access_Test().test();
	new Revoke_Access_Test().test();
	new Unsubscribe_Test().test();

});

/* jshint +W071 */
