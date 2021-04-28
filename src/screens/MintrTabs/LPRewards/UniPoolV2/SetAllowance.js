import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';

import { createTransaction } from '../../../../ducks/transactions';
import snxJSConnector from '../../../../helpers/snxJSConnector';
import { Store } from '../../../../store';
import { GWEI_UNIT } from '../../../../helpers/networkHelper';

import { PageTitle, PLarge } from '../../../../components/Typography';
import { ButtonPrimary, ButtonTertiary } from '../../../../components/Button';

const ALLOWANCE_LIMIT = 100000000;

const SetAllowance = ({ t, goBack }) => {
	const [error, setError] = useState(null);
	const {
		state: {
			network: {
				settings: { gasPrice },
			},
		},
		dispatch,
	} = useContext(Store);

	const onUnlock = async () => {
		const { parseEther } = snxJSConnector.utils;
		const { uniswapV2Contract, unipoolV2Contract } = snxJSConnector;
		try {
			setError(null);

			const gasEstimate = await uniswapV2Contract.estimateGas.approve(
				unipoolV2Contract.address,
				parseEther(ALLOWANCE_LIMIT.toString())
			);
			const transaction = await uniswapV2Contract.approve(
				unipoolV2Contract.address,
				parseEther(ALLOWANCE_LIMIT.toString()),
				{
					gasLimit: Number(gasEstimate) + 10000,
					gasPrice: gasPrice * GWEI_UNIT,
				}
			);
			if (transaction) {
				createTransaction(
					{
						hash: transaction.hash,
						status: 'pending',
						info: t('unipool.locked.transaction'),
						hasNotification: true,
					},
					dispatch
				);
			}
		} catch (e) {
			setError(e.message);
			console.log(e);
		}
	};
	return (
		<>
			<Navigation>
				<ButtonTertiary onClick={goBack}>{t('button.navigation.back')}</ButtonTertiary>
			</Navigation>
			<TitleContainer>
				<Logo src="/images/pancake.png" />
				<PageTitle>{t('unipool.title')}</PageTitle>
				<PLarge>{t('unipool.locked.subtitle')}</PLarge>
			</TitleContainer>
			<ButtonRow>
				<ButtonPrimary onClick={onUnlock}>{t('lpRewards.shared.buttons.unlock')}</ButtonPrimary>
			</ButtonRow>
			{error ? <Error>{`Error: ${error}`}</Error> : null}
		</>
	);
};

const Logo = styled.img``;

const Navigation = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 40px;
`;

const TitleContainer = styled.div`
	margin-top: 30px;
	text-align: center;
`;

const ButtonRow = styled.div`
	display: flex;
	width: 100%;
	justify-content: center;
	margin-top: 64px;
`;

const Error = styled.div`
	color: ${props => props.theme.colorStyles.brandRed};
	font-size: 16px;
	font-family: 'apercu-medium', sans-serif;
	display: flex;
	justify-content: center;
	margin-top: 40px;
`;

export default withTranslation()(SetAllowance);
