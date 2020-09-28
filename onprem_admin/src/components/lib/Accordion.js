'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const AccordionHeader = ({ header, cardStatus }) => {
	// console.log('Accordion.js cardStatus:', cardStatus);
	if (cardStatus?.icon) {
		return (
			<span>
				<img className="icon-image ml-2 pb-1" src={cardStatus.icon} />
				<span className="ml-2">{header}</span>
			</span>
		);
	}
	return (
		<span>
			{cardStatus?.badgeValue && <span className={`ml-2 badge badge-${cardStatus.badgeStatus}`}>{cardStatus.badgeValue}</span>}
			<span className="ml-2">{header}</span>
		</span>
	);
}

const AccordionCard = props => {
	return (
		<div className="card">
			<h5 id={props.id} className="card-head text-dark mb-0 collapsed" data-toggle="collapse" data-target={`#${props.id}Collapse`} aria-expanded="false" aria-controls={`${props.id}Collapse`}>
				{/* <AccordionHeader header={props.header} value={props.badgeValue} status={props.badgeStatus} /> */}
				<AccordionHeader header={props.header} cardStatus={props.cardStatus} />
			</h5>
			<div id={`${props.id}Collapse`} className="card-body bg-dark collapse" aria-labelledby={props.id} data-parent={`#${props.accordionId}`}>
				{props.children}
			</div>
		</div>
	);
};

AccordionCard.propTypes = {
	accordionId: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	header: PropTypes.string.isRequired,
	cardStatus: PropTypes.object,
};

// AccordionCard.defaultProps = {
// 	badgeValue: "OK",
// 	badgeStatus: "dark",
// };

class Accordion extends React.Component {
	headerButtonList() {
		if (this.props.onClickPlus && this.props.expandAllToggle) {
			return (
				<span className="mt-2">
					{/* <img className="icon-image-25x20 mr-3" src="/s/fa/svgs/solid/plus.svg.on-dark.png" /> */}
					<img className="icon-image-25x20 mr-2" src="/s/fa/svgs/solid/plus-square.svg.black-on-dark.png" />
					{/* <img className="icon-image-25x20 mr-4" src="/s/fa/svgs/solid/angle-double-down.svg.black-on-dark.png" /> */}
					<img className="icon-image-25x20 mr-4" src="/s/fa/svgs/solid/angle-double-up.svg.black-on-dark.png" />
					{/* <img className="icon-image-25x20 mr-4" src="/s/fa/svgs/solid/angle-double-down.svg.on-dark.png" /> */}
				</span>
			);
		} else if (this.props.onClickPlus) {
			return (
				<span className="mt-2">
					<img className="icon-image-25x20 mr-4" src="/s/fa/svgs/solid/plus-square.svg.black-on-dark.png" />
				</span>
			);
		} else if (this.props.expandAllToggle) {
			return (
				<span className="mt-2">
					<img className="icon-image-25x20 mr-4" src="/s/fa/svgs/solid/angle-double-up.svg.black-on-dark.png" />
				</span>
			);
		}
		return <></>;
	}

	render() {
		return (
			<div className="Accordion container bg-secondary">
				<div className="row justify-content-between">
					<p>{this.props.message}</p>
					{this.headerButtonList()}
				</div>
				<div className="row">
					<div className="accordion col-12" id={this.props.accordionId}>
						{this.props.cards.map((c) => (
							<AccordionCard
								key={c.id}
								accordionId={this.props.accordionId}
								id={c.id}
								header={c.header}
								cardStatus={this.props.statuses?.[c.id]}
								// badgeValue={this.props.statuses?.[c.id]?.value}
								// badgeStatus={this.props.statuses?.[c.id]?.status}
								// statusIcon={this.props.statuses?.[c.id]?.icon}
							>
								<span>{React.cloneElement(c.bodyComponent, c.bodyComponentProps)}</span>
							</AccordionCard>
						))}
					</div>
				</div>
			</div>
		);
	}
}

Accordion.propTypes = {
	accordionId: PropTypes.string.isRequired,
	cards: PropTypes.array.isRequired,
	statuses: PropTypes.object,
	message: PropTypes.string,
	onClickPlus: PropTypes.func,
	expandAllToggle: PropTypes.bool,
};

// this is more for documentation...
Accordion.defaultProps = {
	cards: [
		{
			id: 'card-id-not-displayed',
			header: 'card header',
			bodyComponent: (<></>),		// component to render the body of the card
			bodyComponentProps: {},
		}
	],
	expandAllToggle: true,
};

const statusesExample = {
	__cardId__: {
		badgeText: 'badge text',	// any string
		badgeStatus: 'bootstrap status color',	// dark, info, warning, success, danger, ...
	}
};

export default Accordion;
