/* eslint-disable */
import React, { useState, useContext, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';

import snxJSConnector from '../../../../helpers/snxJSConnector';
import { Store } from '../../../../store';

import { bigNumberFormatter, formatCurrency } from '../../../../helpers/formatters';
import TransactionPriceIndicator from '../../../../components/TransactionPriceIndicator';
import { updateGasLimit } from '../../../../ducks/network';

import { PageTitle, PLarge, ButtonTertiaryLabel } from '../../../../components/Typography';
import DataBox from '../../../../components/DataBox';
import { ButtonTertiary, ButtonPrimary } from '../../../../components/Button';

import CurvepoolActions from '../../../CurvepoolActions';
import UnstakeOldContract from './oldContract';

const TRANSACTION_DETAILS = {
	stake: {
		contractFunction: 'stake',
		gasLimit: 200000,
	},
	claim: {
		contractFunction: 'getReward',
		gasLimit: 250000,
	},
	unstake: {
		contractFunction: 'withdraw',
		gasLimit: 250000,
	},
	exit: {
		contractFunction: 'exit',
		gasLimit: 250000,
	},
	migrate: {
		contractFunction: 'exit',
		gasLimit:250000,
	}	
};

const Stake = ({ t, goBack }) => {
	const { curvepoolContract } = snxJSConnector;
	const [balances, setBalances] = useState(null);
	const [currentScenario, setCurrentScenario] = useState({});
	const [withdrawAmount, setWithdrawAmount] = useState('');
	const [oldBalance, setOldBalance] = useState(0)

	const {
		state: {
			wallet: { currentWallet },
		},
		dispatch,
	} = useContext(Store);

	const fetchData = useCallback(async () => {
		if (!snxJSConnector.initialized) return;
		try {
			const { curveLPTokenContract, curvepoolContract, oldCurvepoolContract, drvPoolContract } = snxJSConnector;
			const [univ1Held, univ1Staked, drvPoolLp, rewards] = await Promise.all([
				curveLPTokenContract.balanceOf(currentWallet),
				curvepoolContract.balanceOf(currentWallet),
				drvPoolContract.balanceOf(currentWallet),
				curvepoolContract.earned(currentWallet),
			]);

			/*let actualLP 
			if (drvPoolLp.eq(0) && univ1Staked.gt(0)) {
				actualLP = univ1Staked
			} else if (drvPoolLp.gt(0) && univ1Staked.eq(0)) {
				actualLP = drvPoolLp
			} else if (drvPoolLp.eq(0) && univ1Staked.eq(0)) {
				actualLP = 0
			} */

			setBalances({
				drvPoolLp: bigNumberFormatter(drvPoolLp),
				univ1Held: bigNumberFormatter(univ1Held),
				univ1HeldBN: univ1Held,
				univ1Staked: bigNumberFormatter(univ1Staked),
				univ1StakedBN: univ1Staked,
				rewards: bigNumberFormatter(rewards),
			});
			updateGasLimit(TRANSACTION_DETAILS.stake.gasLimit, dispatch);
			//console.log(bigNumberFormatter(drvPoolLp))
		
		} catch (e) {
			console.log(e);
		}


		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentWallet, snxJSConnector.initialized]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (!currentWallet) return;
		const { curveLPTokenContract, curvepoolContract, oldCurvepoolContract } = snxJSConnector;

		(async () => {
			const res = await oldCurvepoolContract.balanceOf(currentWallet)
			if ( res) {
				//console.error("has balance in old contract")
				setOldBalance(res)
			}
		})()

		curvepoolContract.on('Staked', user => {
			if (user === currentWallet) {
				fetchData();
			}
		});

		curvepoolContract.on('Withdrawn', user => {
			if (user === currentWallet) {
				fetchData();
			}
		});

		curvepoolContract.on('RewardPaid', user => {
			if (user === currentWallet) {
				fetchData();
			}
		});

		return () => {
			if (snxJSConnector.initialized) {
				curvepoolContract.removeAllListeners('Staked');
				curvepoolContract.removeAllListeners('Withdrawn');
				curvepoolContract.removeAllListeners('RewardPaid');
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentWallet]);

	return (
		<Container>
			<UnstakeOldContract />

			<CurvepoolActions {...currentScenario} onDestroy={() => setCurrentScenario({})} />
			<Navigation>
				<ButtonTertiary onClick={goBack}>{t('button.navigation.back')}</ButtonTertiary>
				<ButtonTertiary
					as="a"
					target="_blank"
					href={`https://bscscan.com/address/${curvepoolContract.address}`}
				>
					{t('lpRewards.shared.buttons.goToContract')} ↗
				</ButtonTertiary>
			</Navigation>
			<PageTitle>{t('curvepool.title')}</PageTitle>
			<PLarge>{t('curvepool.unlocked.subtitle')}</PLarge>
			<PLarge>
				<Link href="#todo" target="_blank">
					{/*<ButtonTertiaryLabel>{t('lpRewards.shared.unlocked.link')}</ButtonTertiaryLabel>*/}
				</Link>
			</PLarge>
			<PLarge>
				<Link href="https://derive.fi/#/deposit/usd" target="_blank">
					{<ButtonTertiaryLabel>{"Go to Derive Finance"}</ButtonTertiaryLabel>}
				</Link>
			</PLarge>				
			<BoxRow>
				<DataBox
					heading={t('lpRewards.shared.data.balance')}
					body={`${balances ? formatCurrency(balances.univ1Held) : 0} deriveUSD`}
				/>
				<DataBox
					heading={t('lpRewards.shared.data.staked')}
					body={`${balances ? formatCurrency(balances.univ1Staked) : 0} deriveUSD`}
				/>
				<DataBox
					heading={t('lpRewards.shared.data.rewardsAvailable')}
					body={`${balances ? formatCurrency(balances.rewards) : 0} OKS`}
				/>
			</BoxRow>
			<ButtonBlock>
				<ButtonRow>
					<ButtonAction
						disabled={!balances || !balances.univ1Held}
						onClick={() =>
							setCurrentScenario({
								action: 'stake',
								label: t('lpRewards.shared.actions.staking'),
								amount: `${balances && formatCurrency(balances.univ1Held)} deriveUSD`,
								param: balances && balances.univ1HeldBN,
								...TRANSACTION_DETAILS['stake'],
							})
						}
					>
						{t('lpRewards.shared.buttons.stake')}
					</ButtonAction>
					<ButtonAction
						disabled={!balances || !balances.rewards}
						onClick={() =>
							setCurrentScenario({
								action: 'claim',
								label: t('lpRewards.shared.actions.claiming'),
								amount: `${balances && formatCurrency(balances.rewards)} OKS`,
								...TRANSACTION_DETAILS['claim'],
							})
						}
					>
						{t('lpRewards.shared.buttons.claim')}
					</ButtonAction>
				</ButtonRow>
				<ButtonRow>
					<ButtonAction
						disabled={!balances || !balances.univ1Staked}
						onClick={() =>
							setCurrentScenario({
								action: 'unstake',
								label: t('lpRewards.shared.actions.unstaking'),
								amount: `${balances && formatCurrency(balances.univ1Staked)} deriveUSD`,
								param: balances && balances.univ1StakedBN,
								...TRANSACTION_DETAILS['unstake'],
							})
						}
					>
						{t('lpRewards.shared.buttons.unstake')}
					</ButtonAction>
					<ButtonAction
						disabled={!balances || (!balances.univ1Staked && !balances.rewards)}
						onClick={() =>
							setCurrentScenario({
								action: 'exit',
								label: t('lpRewards.shared.actions.exiting'),
								amount: `${balances && formatCurrency(balances.univ1Staked)} deriveUSD & ${balances &&
									formatCurrency(balances.rewards)} OKS`,
								...TRANSACTION_DETAILS['exit'],
							})
						}
					>
						{t('lpRewards.shared.buttons.exit')}
					</ButtonAction>
				</ButtonRow>
			</ButtonBlock>
			<TransactionPriceIndicator canEdit={true} />
		</Container>
	);
};

const Link = styled.a`
	text-decoration-color: ${props => props.theme.colorStyles.buttonTertiaryText};
`;

const Container = styled.div`
	min-height: 850px;
`;

const Navigation = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 40px;
`;

const BoxRow = styled.div`
	margin-top: 42px;
	display: flex;
`;

const ButtonBlock = styled.div`
	margin-top: 58px;
`;

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

export default withTranslation()(Stake);
