import 'react-native';
import React from 'react';
import type { Linking as LinkingType } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChainNameEnum, Route } from '@app/AppState';
import { remoteServer } from '@app/AppState/types/ServerType';
import {
  ContextAppLoadedProvider,
  defaultAppContextLoaded,
} from '@app/context';
import Settings from '@screens/Settings';
import ValueTransferDetail from '@screens/ValueTransferDetail';
import { mockValueTransfers } from '../__mocks__/dataMocks/mockValueTransfers';
import mockNavigation from '../__mocks__/dataMocks/mockNavigation';

const Linking: typeof LinkingType = jest.requireActual('react-native').Linking;
const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

afterEach(() => openURL.mockClear());

test.each([
  [ChainNameEnum.catecashDevnetChainName, 'scan-devnet'],
  [ChainNameEnum.catecashTestnetChainName, 'scan-testnet'],
  [ChainNameEnum.catecashMainnetChainName, 'scan'],
])('Tests that Settings opens the %s explorer for that wallet', (chain, host) => {
  render(
    <ContextAppLoadedProvider
      value={{ ...defaultAppContextLoaded, walletChainName: chain }}
    >
      <Settings
        navigation={mockNavigation}
        route={{ key: 'settings', name: Route.Settings, params: undefined }}
      />
    </ContextAppLoadedProvider>,
  );
  fireEvent.press(screen.getByTestId('settings.blockexplorer'));
  expect(openURL).toHaveBeenCalledWith(
    `https://${host}.catecash.com/#/about`,
  );
});

test('Tests that a Testnet wallet opens its transaction in the Testnet explorer when its saved server says Devnet', () => {
  const vt = mockValueTransfers[0];
  render(
    <ContextAppLoadedProvider
      value={{
        ...defaultAppContextLoaded,
        walletChainName: ChainNameEnum.catecashTestnetChainName,
        server: remoteServer(
          'https://old.example:443',
          ChainNameEnum.catecashDevnetChainName,
        ),
      }}
    >
      <ValueTransferDetail
        navigation={mockNavigation}
        route={{
          key: 'transfer',
          name: Route.ValueTransferDetail,
          params: { vt },
        } as never}
      />
    </ContextAppLoadedProvider>,
  );
  fireEvent.press(screen.getByTestId('valuetransferdetail.explorer'));
  expect(openURL).toHaveBeenCalledWith(
    `https://scan-testnet.catecash.com/#/tx/${vt.txid}`,
  );
});
