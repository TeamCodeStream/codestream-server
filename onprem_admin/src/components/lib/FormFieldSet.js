'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const FieldGroup = ({id, label, type, placeholder, disabled, mutedText}) => {
	const ariaDescribedBy = placeholder ? placeholder + 'Help' : '';
	placeholder = placeholder || '';
	return (
		<span className="col-12">
			<label className="form-control-label" htmlFor={id}>
				{label}
			</label>
			<input
				className="form-control"
				type={type || 'text'}
				id={id}
				placeholder={placeholder}
				aria-describedby={ariaDescribedBy}
				disabled={disabled || false}
			/>
			{mutedText && (
				<small id={ariaDescribedBy} className="form-text text-light">
					{mutedText}
				</small>
			)}
		</span>
	);
};

const FormFieldSet = ({ legend, fieldset, defaultColWidth }) => {
	return (
		<fieldset className="form-group">
			{legend && <legend>{legend}</legend>}
			{fieldset.map((row) => {
				return (
					<div key={row[0].id + 'Row'} className="form-row row-cols-12 justify-content-center">
						{row.map((field) => {
							return (
								<div key={field.id + 'Field'} className={`form-group ${field.width || defaultColWidth}`}>
									{field.labelWidth
										? <div className="form-row col-12"><FieldGroup {...field} /></div>
										: <FieldGroup {...field} />
									}
								</div>
							);
						})}
					</div>
				);
			})}
		</fieldset>
	);
};

FormFieldSet.propTypes = {
	defaultColWidth: PropTypes.string,
	legend: PropTypes.string,
	fieldset: PropTypes.array.isRequired,
};

// These defaults provide an example of a fieldset.
FormFieldSet.defaultProps = {
	defaultColWidth: 'col-12',
	// legend: 'Example FieldSet Legend',
	fieldset: [
		// Each index (sub-list) denotes a new row in the form construction
		[
			// Each object represents one field
			{
				// required
				id: 'publicHostName',
				label: 'Public Hostname',
				placeholder: 'my-host.my-company.com',
				// optional
				mutedText: 'The hostname CodeStream clients will connect to.',
				// type: 'number',	// default = 'text'
				// width: 'col-7',	// default = defaultColWidth property
				// disabled: true,	// default = false
			},
		],
		[
			{
				id: 'apiInsecurePort',
				label: 'API Insecure Port',
				placeholder: 80,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterInsecurePort',
				label: 'Broadcaster Insecure Port',
				placeholder: 12080,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminInsecurePort',
				label: 'Admin Insecure Port',
				placeholder: 8080,
				width: 'col-4',
				type: 'number',
			},
		],
		[
			{
				id: 'apiSecurePort',
				label: 'API Secure Port',
				placeholder: 443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterSecurePort',
				label: 'Broadcaster Secure Port',
				placeholder: 12443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminSecurePort',
				label: 'Admin Secure Port',
				placeholder: 8443,
				width: 'col-4',
				type: 'number',
			},
		],
	],
};

export default FormFieldSet;
