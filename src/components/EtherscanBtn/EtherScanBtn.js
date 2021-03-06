import React from 'react';
import { ButtonSecondary } from '../../components/Button';

export default function EtherScanBtn({ networkName, transactionHash, children }) {
	return (
		<ButtonSecondary
			href={`https://${
				networkName === 'mainnet' ? '' : networkName + '.'
			}tronscan.io/#/transaction/${transactionHash}`}
			as="a"
			target="_blank"
		>
			{children}
		</ButtonSecondary>
	);
}
