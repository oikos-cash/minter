import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import UniPool from './UniPool';
import CurvePool from './CurvePool';

import UniPoolV2 from './UniPoolV2';
import CurvePoolDRV from './CurvePoolDRV';

import { H1, PageTitle } from '../../../components/Typography';
import PageContainer from '../../../components/PageContainer';

const POOLS = [
	{
		title: 'lpRewards.actions.unipool.title',
		name: 'pancake',
	},
	{ title: 'lpRewards.actions.curvepool.title', name: 'derive' },
];

const POOLS2 = [
	{
		title: 'lpRewards.actions.unipoolV2.title',
		name: 'pancakeV2',
	},
	{ title: 'lpRewards.actions.derivepool.title', name: 'deriveDRV' },	
];

const LPRewards = () => {
	const { t } = useTranslation();
	const [currentPool, setCurrentPool] = useState(null);
	const goBack = () => setCurrentPool(null);

	const getPoolComponent = poolName => {
		switch (poolName) {
			case 'pancake':
				return <UniPool goBack={goBack} />;
			case 'derive':
				return <CurvePool goBack={goBack} />;
			case 'pancakeV2':
				return <UniPoolV2 goBack={goBack} />;
			case 'deriveDRV':
				return <CurvePoolDRV goBack={goBack} />;				
		}
	};

	return (
		<PageContainer>
			{currentPool ? (
				getPoolComponent(currentPool)
			) : (
				<>
					<PageTitle>{t('lpRewards.intro.title')}</PageTitle>
					<ButtonRow>
						{POOLS.map(({ title, name }) => {
							return (
								<Button onClick={() => setCurrentPool(name)}>
									<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
									</ButtonContainer>
								</Button>
							);
						})}
					</ButtonRow>
					<br />
					<ButtonRow>
						{POOLS2.map(({ title, name }) => {
							return (
								<Button onClick={() => setCurrentPool(name)}>
									<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
									</ButtonContainer>
								</Button>
							);
						})}
					</ButtonRow>					
				</>
			)}
		</PageContainer>
	);
};

const Button = styled.button`
	flex: 1;
	cursor: pointer;
	height: 352px;
	max-width: 352px;
	background-color: ${props => props.theme.colorStyles.panelButton};
	border: 1px solid ${props => props.theme.colorStyles.borders};
	border-radius: 5px;
	box-shadow: 0px 5px 10px 5px ${props => props.theme.colorStyles.shadow1};
	transition: transform ease-in 0.2s;
	&:hover {
		background-color: ${props => props.theme.colorStyles.panelButtonHover};
		box-shadow: 0px 5px 10px 8px ${props => props.theme.colorStyles.shadow1};
		transform: translateY(-2px);
	}
	&:first-child {
		margin-right: 20px;
	}
`;

const ButtonContainer = styled.div`
	padding: 10px;
	margin: 0 auto;
`;

const ButtonRow = styled.div`
	display: flex;
	justify-content: space-between;
	margin: ${props => (props.margin ? props.margin : 0)};
`;

const ActionImage = styled.img`
	height: ${props => (props.big ? '64px' : '48px')};
	width: ${props => (props.big ? '64px' : '48px')};
`;

export default LPRewards;
