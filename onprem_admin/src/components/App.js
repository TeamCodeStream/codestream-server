'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
// import $ from 'jquery';

// my components
import Header from './header/Header';
import Omnibar from './omnibar/Omnibar';
import Pane from './pane/Pane';
import Footer from './footer/Footer';
import SubNav from './subnav/SubNav';
// import BSTest1 from './pane/configuration/layoutTests/BSTest1';
// import AccordionArrows from './pane/configuration/layoutTests/AccordionArrows';
// import Accordion from './lib/Accordion';


class App extends React.Component {
	componentDidMount() {
		// enable bootstrap tooltips
		// $(function () {
		// 	$('[data-toggle="tooltip"]').tooltip();
		// });
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	// layout-*: classes for defining layout sections
	render() {
		return (
			// <div className="App container-fluid p-0 text-light bg-secondary">
			<div className="App container-fluid p-0 d-flex vh-100 h-100 flex-column text-light bg-secondary">
				{/* The header section is where the Nav bar lies - it is always present */}
				{/* <Header message={this.props.pageHeader} /> */}
				<div className="row row-cols-1">
					<span className="col">
						<Header />
					</span>
				</div>

				{/* The 'onmibar' is a section below the navbar and above the pane which will exist for all screens. */}
				<div className="row row-cols-1">
					<span className="col">
						<Omnibar />
					</span>
				</div>

				{/* The 'onmibar' is a section below the navbar and above the pane which will exist for all screens. */}
				<div className="row row-cols-1">
					<span className="col">
						<SubNav />
					</span>
				</div>

				{/* The 'pane' is where all inputs and feedback will go. Each 'pane' is associated with a nav item. */}
				{/* <div className="row row-cols-1 no-gutters"> */}
				{/* <span className="col"> */}
				<div className="row row-cols-1 flex-fill d-flex overflow-auto">
					<span className="col portlet-conteainer portlet-dropzone">
						<Pane />
						{/* <Accordion /> */}
						{/* <BSTest1 /> */}
					</span>
				</div>

				{/* The footer contains social links and typical footer stuff - it is always present */}
				<div className="row row-cols-1">
					<span className="col">
						<Footer />
					</span>
				</div>
			</div>
		);
	}
};

// AppComponent.propTypes = {
// 	pageHeader: PropTypes.string,
// 	initialState: PropTypes.object
// };

// AppComponent.defaultProps = {
// 	pageHeader: 'CodeStream On-Prem Administration',
// 	initialState: {}
// };

// returns data needed for this component
// const mapStateToProps = function() {
// 	return {};
// }

// returns behavior for the component
// const mapDispatchToProps = function() {
// 	return {};
// }

// const App = connect(mapStateToProps, mapDispatchToProps)(AppComponent);
// const App = connect(mapStateToProps)(AppComponent);
export default App;
