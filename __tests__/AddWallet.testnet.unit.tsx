import 'react-native';
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import {
  ContextAppLoadedProvider,
  defaultAppContextLoaded,
} from '@app/context';
import { ChainNameEnum, Route, TranslateType } from '@app/AppState';
import { readAddWalletDraft } from '@app/services/addWalletDraft';
import AddWallet from '@screens/AddWallet/AddWallet';

jest.mock('@app/services/recoveryWalletInfo', () => ({
  recoveryEntriesOnDevice: jest.fn(async () => []),
}));

const en = require('../app/translations/en.json');
const translate = (key: string): TranslateType =>
  key.split('.').reduce((value, part) => value?.[part], en) ?? key;

test('Tests that Testnet is preselected when wallet creation opens from a Devnet server screen', async () => {
  render(
    <ContextAppLoadedProvider value={{ ...defaultAppContextLoaded, translate }}>
      <AddWallet
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'add',
          name: Route.AddWallet,
          params: { initialChain: ChainNameEnum.catecashTestnetChainName },
        }}
      />
    </ContextAppLoadedProvider>,
  );

  await waitFor(() => {
    expect(readAddWalletDraft().server).toEqual({
      kind: 'remote',
      uri: 'https://wallet-testnet.catecash.com:443',
      chainName: ChainNameEnum.catecashTestnetChainName,
    });
  });
});

test('Tests that Devnet is preselected when wallet creation opens from a Testnet server screen', async () => {
  render(
    <ContextAppLoadedProvider value={{ ...defaultAppContextLoaded, translate }}>
      <AddWallet
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'add',
          name: Route.AddWallet,
          params: { initialChain: ChainNameEnum.catecashDevnetChainName },
        }}
      />
    </ContextAppLoadedProvider>,
  );

  await waitFor(() => {
    expect(readAddWalletDraft().server).toEqual({
      kind: 'remote',
      uri: 'https://wallet-devnet.catecash.com:443',
      chainName: ChainNameEnum.catecashDevnetChainName,
    });
  });
});

test('Tests that Mainnet is preselected when wallet creation opens from a Mainnet server screen', async () => {
  render(
    <ContextAppLoadedProvider value={{ ...defaultAppContextLoaded, translate }}>
      <AddWallet
        navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
        route={{
          key: 'add',
          name: Route.AddWallet,
          params: { initialChain: ChainNameEnum.catecashMainnetChainName },
        }}
      />
    </ContextAppLoadedProvider>,
  );

  await waitFor(() => {
    expect(readAddWalletDraft().server).toEqual({
      kind: 'remote',
      uri: 'https://wallet.catecash.com:443',
      chainName: ChainNameEnum.catecashMainnetChainName,
    });
  });
});
