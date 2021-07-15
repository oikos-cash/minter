/* eslint-disable */
import React, { useState, useContext, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';

import snxJSConnector from '../../../../helpers/snxJSConnector';
import { Store } from '../../../../store';

import { bigNumberFormatter, formatCurrency, formatUniv1 } from '../../../../helpers/formatters';
import TransactionPriceIndicator from '../../../../components/TransactionPriceIndicator';
import { updateGasLimit } from '../../../../ducks/network';

import { PageTitle, PLarge } from '../../../../components/Typography';
import DataBox from '../../../../components/DataBox';
import { ButtonTertiary, ButtonPrimary } from '../../../../components/Button';

import UnipoolActions from '../../../UnipoolActions';

const ButtonRow = styled.div`
	display: flex;
	margin-bottom: 28px;
`;

const ButtonAction = styled(ButtonPrimary)`
	flex: 1;
	width: 10px;
	&:first-child {
		margin-right: 34px;
	}
`;
export default withTranslation()(({ t }) => {
	const { curvepoolContract, oldCurvepoolContract } = snxJSConnector;

	// const [balances, setBalances] = useState(null);
	// const [withdrawAmount, setWithdrawAmount] = useState('');
	const [oldBalance, setOldBalance] = useState(0);
	const [isMigrated, setIsMigrated] = useState(true);
	const [isMigrationPending, setIsMigrationPending] = useState(false);

	const {
		state: {
			wallet: { currentWallet },
		},
		dispatch,
	} = useContext(Store);

	useEffect(() => {
		if (!currentWallet) return;
		
		(async () => {
			console.log(oldCurvepoolContract)
			const res = await oldCurvepoolContract.balanceOf(currentWallet);
			if (res > 0) {
				setOldBalance(res);
				setIsMigrated(false);
			}
		})();
	}, [currentWallet, snxJSConnector.initialized]);

	const migrate = async () => {
		try {
			console.log({ oldBalance })
			await oldCurvepoolContract.withdraw(oldBalance);
			setIsMigrationPending(true)
		} catch (err) {
			console.error(err);
		}
	};
	if (isMigrated) {
		return <></> 
	}
	if (isMigrationPending) {
		return (
			<ButtonRow>
				<ButtonAction
				disabled={true}
					style={{
						marginRight: '0px',
						backgroundColor:"red"
					}}
				>
					Your LP Tokens were moved to the new contract, please refresh the page in a few seconds.
				</ButtonAction>
			</ButtonRow>
		);
	}
	return (
		<ButtonRow>
			<ButtonAction
				onClick={() => migrate()}
				style={{
					marginRight: '0px',
					backgroundColor: 'red',
				}}
			>
				{t('lpRewards.shared.buttons.migrate')} {(oldBalance / 1e18)} deriveUSD
			</ButtonAction>
		</ButtonRow>
	);
});