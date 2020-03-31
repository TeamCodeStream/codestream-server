// defines various limits

'use strict';

module.exports = {
	maxPostsPerRequest: 100, 	// never serve more than this many posts in a page
	maxStreamsPerRequest: 500,	// never serve more than this many streams in a page
	maxMarkersPerRequest: 100	// never serve more than this many markers in a page (not currently used)
};
