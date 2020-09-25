'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Nav from './nav/Nav';

// stateless - when you don't need lifecycle or state features
const Header = () => {
	return (
		<header className="Header layout-header container-fluid">
			<Nav />
		</header>
	);
};

// Header.propTypes = {
// 	message: PropTypes.string,
// };

// Header.defaultProps = {
// 	message: 'you need to set the Header'
// };

export default Header;
