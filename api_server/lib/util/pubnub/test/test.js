'use strict';

var PubNubTest = require('./pubnub_test');
var NoAccessTest = require('./no_access_test');
var RevokeAccessTest = require('./revoke_access_test');
var UnsubscribeTest = require('./unsubscribe_test');

// make jshint happy
/* globals describe */

/* jshint -W071 */

describe('pubnub', function() {

	this.timeout(10000);

	new PubNubTest().test();
	new NoAccessTest().test();
	new RevokeAccessTest().test();
	new UnsubscribeTest().test();

});

/* jshint +W071 */
