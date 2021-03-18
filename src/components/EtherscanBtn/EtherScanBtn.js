import React from 'react';
import { ButtonSecondary } from '../../components/Button';

export default function EtherScanBtn({ networkName, transactionHash, children }) {
	return (
		<ButtonSecondary
			href={`https://${
				networkName === 'bsc' ? '' : networkName + '.'
			}bscscan.com/tx/${transactionHash}`}
			as="a"
			target="_blank"
		>
			{children}
		</ButtonSecondary>
	);
}
