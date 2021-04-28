import React, { useState, useCallback, useEffect, useContext } from 'react';
import styled from 'styled-components';

import snxJSConnector from '../../../../helpers/snxJSConnector';
import { Store } from '../../../../store';

import { bigNumberFormatter } from '../../../../helpers/formatters';

import PageContainer from '../../../../components/PageContainer';
import Spinner from '../../../../components/Spinner';

import SetAllowance from './SetAllowance';
import Stake from './Stake';

const UniPoolV2 = ({ goBack }) => {
	const [hasAllowance, setAllowance] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const {
		state: {
			wallet: { currentWallet },
		},
	} = useContext(Store);

	const fetchAllowance = useCallback(async () => {
		if (!snxJSConnector.initialized) return;
		const { uniswapV2Contract, unipoolV2Contract } = snxJSConnector;
		try {
			setIsLoading(true);
			const allowance = await uniswapV2Contract.allowance(currentWallet, unipoolV2Contract.address);
			setAllowance(!!bigNumberFormatter(allowance));
			setIsLoading(false);
		} catch (e) {
			console.log(e);
			setIsLoading(false);
			setAllowance(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentWallet, snxJSConnector.initialized]);

	useEffect(() => {
		fetchAllowance();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchAllowance]);

	useEffect(() => {
		if (!currentWallet) return;
		const { uniswapV2Contract, unipoolV2Contract } = snxJSConnector;

		uniswapV2Contract.on('Approval', (owner, spender) => {
			if (owner === currentWallet && spender === unipoolV2Contract.address) {
				setAllowance(true);
			}
		});

		return () => {
			if (snxJSConnector.initialized) {
				uniswapV2Contract.removeAllListeners('Approval');
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentWallet]);

	return (
		<PageContainer>
			{isLoading ? (
				<SpinnerContainer>
					<Spinner />
				</SpinnerContainer>
			) : !hasAllowance ? (
				<SetAllowance goBack={goBack} />
			) : (
				<Stake goBack={goBack} />
			)}
		</PageContainer>
	);
};

const SpinnerContainer = styled.div`
	margin: 100px;
`;

export default UniPoolV2;
