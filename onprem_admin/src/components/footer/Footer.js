'use strict';

import React from 'react';
// import PropTypes from 'prop-types';

class Footer extends React.Component {
	// state = {};

	// lifecycle methods
	componentDidMount() {
		// dom has been mounted in browser successfully
		// ajax calls, set timers & listeners, etc...
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	// bootstrap flexbox layout model
	// d-flex: use flexbox model for element's layout
	// justify-content-center: center content in flexbox
	// align-item-center: vertical alignment in a flexbox
	// px-2: add padding in the X direction to the element (1-5)
	// py-N: add padding in the Y direction to the element (N=1-5)
	// ml-N: left margin (t)op, (b)ottom, (l)eft, (r)ight
	render() {
		return (
			<footer className="Footer layout-footer container-fluid  justify-content-center bg-dark">
				<div className="row justify-content-center">
					<section className="py-4">
						<a className="text-light py-5 px-2" href="https://twitter.com/teamcodestream" rel="noopener noreferrer" target="_blank">
							<i className="layout-icon  fab fa-twitter"></i>
						</a>
						<a className="text-light py-5 px-2" href="https://github.com/teamcodestream/codestream" rel="noopener noreferrer" target="_blank">
							<i className="layout-icon  fab fa-github"></i>
						</a>
						<a className="text-light py-5 px-2" href="https://blog.codestream.com" rel="noopener noreferrer" target="_blank">
							<i className="layout-icon  fas fa-blog"></i>
						</a>
						{/* <a className="text-light" href="https://raw.githubusercontent.com/TeamCodeStream/onprem-install/master/docs/src/assets/terms.txt">Terms of Service</a> */}
					</section>
				</div>
			</footer>
		);
	}
}

// Footer.propTypes = {
// 	config: PropTypes.object,
// 	contests: PropTypes.array.isRequired,
// };

export default Footer;
