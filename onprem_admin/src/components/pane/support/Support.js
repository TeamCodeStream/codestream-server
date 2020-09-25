import React, { Component } from 'react';

class Support extends Component {
	render() { 
		return (
			<section className="Support layout-pane-support container-fluid col-8">
				<div className="row justify-content-center">
					<p className="mt-3">
						We keep a very watchful eye on{' '}
						<a href="https://github.com/teamcodestream/codestream/issues" target="_blank">
							Github Issues
						</a>
						{' '}associated with the{' '}
						<a href="https://github.com/teamcodestream/codestream" target="_blank">
							CodeStream
						</a>{' '}
						repository and you can always reach us via email at{' '}
						<a href="mailto:support@codestream.com?body=CodeStream Installation ID: 12345, Product: Single Linux Host">support@codestream.com</a>.
					</p>
				</div>
			</section>
		);
	}
}

export default Support;
