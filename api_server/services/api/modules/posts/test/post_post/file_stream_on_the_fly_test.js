'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');

class File_Stream_On_The_Fly_Test extends Direct_On_The_Fly_Test {

	constructor (options) {
		super(options);
		this.stream_type = 'file';
	}

	get description () {
		return 'should return a valid post and stream when creating a post and creating a file stream on the fly';
	}

	make_post_options (callback) {
		this.stream_options.repo_id = this.repo._id;
		super.make_post_options(callback);
	}
}

module.exports = File_Stream_On_The_Fly_Test;
