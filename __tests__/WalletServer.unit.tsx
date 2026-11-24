import 'react-native';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { usePreventRemove } from '@react-navigation/native';
import {
  ContextAppLoadedProvider,
  defaultAppContextLoaded,
} from '@app/context';
import {
  ChainNameEnum,
  Route,
  SelectServerEnum,
  TranslateType,
} from '@app/AppState';
import { remoteServer } from '@app/AppState/types/ServerType';
import WalletServer from '@screens/Server/WalletServer';
import { pickAutomatic } from '@app/services/serverPicking';
import SettingsFileImpl from '@app/services/SettingsFileImpl';
import { getApplicationName } from 'react-native-device-info';

jest.mock('@app/walletBackend', () => ({ probeServer: jest.fn() }));
jest.mock('@app/services/SettingsFileImpl', () => ({
  __esModule: true,
  default: {
    serverOf: jest.fn(async () => ({
      server: {
        kind: 'remote',
        uri: 'https://other.zec:443',
        chainName: 'main',
      },
      selectServer: 'list',
    })),
    writeWalletServer: jest.fn(async () => true),
  },
}));
jest.mock('@app/services/serverPicking', () => ({
  otherServersFor: jest.fn().mockResolvedValue([]),
  pickAutomatic: jest.fn(),
  probeUri: jest.fn().mockResolvedValue({ latency: 40, height: '3473752' }),
  recommendedServers: jest.fn().mockReturnValue([]),
}));

const en = require('../app/translations/en.json');
const translate = (key: string): TranslateType =>
  key.split('.').reduce((o, k) => o?.[k], en) ?? key;

const mount = (
  setServerOption: jest.Mock,
  forWallet = '',
  chain = ChainNameEnum.mainChainName,
  otherChain = chain,
  switchWallet = jest.fn(),
) => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    addListener: jest.fn(() => () => {}),
    setOptions: jest.fn(),
  };
  render(
    <ContextAppLoadedProvider
      value={{
        ...defaultAppContextLoaded,
        translate,
        server: remoteServer(
          'https://zec.rocks:443',
          ChainNameEnum.mainChainName,
        ),
        selectServer: SelectServerEnum.list,
        walletChainName: chain,
        netInfo: { ...defaultAppContextLoaded.netInfo, isConnected: true },
        setServerOption,
        switchWallet,
        walletId: 'w1',
        wallets: ['w1', 'w2'].map((id, i) => ({
          id,
          hasFile: true,
          meta: {
            v: 1,
            id,
            order: i + 1,
            createdAt: 0,
            name: `Wallet ${i + 1}`,
            chain: i === 0 ? chain : otherChain,
          },
        })),
      }}
    >
      <WalletServer
        navigation={navigation as never}
        route={
          {
            key: 'server',
            name: Route.Server,
            params: forWallet ? { walletId: forWallet } : undefined,
          } as never
        }
      />
    </ContextAppLoadedProvider>,
  );
  return navigation;
};

test('Tests that Settings Server opens a Testnet wallet flow for a Devnet wallet with a stale saved server', () => {
  const appName = getApplicationName as jest.Mock;
  appName.mockReturnValue('Catecash');
  try {
    const navigation = mount(
      jest.fn(),
      '',
      ChainNameEnum.catecashDevnetChainName,
    );
    const testnet = screen.getByTestId('server.net.catecash-testnet');
    expect(testnet.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(testnet);
    expect(navigation.navigate).toHaveBeenCalledWith(Route.AddWallet, {
      initialChain: ChainNameEnum.catecashTestnetChainName,
    });
  } finally {
    appName.mockReturnValue('Zingo');
  }
});

test('Tests that Settings Server opens a Devnet wallet flow for a Testnet wallet', () => {
  const appName = getApplicationName as jest.Mock;
  appName.mockReturnValue('Catecash');
  try {
    const navigation = mount(
      jest.fn(),
      '',
      ChainNameEnum.catecashTestnetChainName,
    );
    fireEvent.press(screen.getByTestId('server.net.catecash-devnet'));
    expect(navigation.navigate).toHaveBeenCalledWith(Route.AddWallet, {
      initialChain: ChainNameEnum.catecashDevnetChainName,
    });
  } finally {
    appName.mockReturnValue('Zingo');
  }
});

test('Tests that Settings Server opens an existing Devnet wallet when the current wallet uses Testnet', () => {
  const appName = getApplicationName as jest.Mock;
  appName.mockReturnValue('Catecash');
  try {
    const switchWallet = jest.fn().mockResolvedValue({ kind: 'opened' });
    const navigation = mount(
      jest.fn(),
      '',
      ChainNameEnum.catecashTestnetChainName,
      ChainNameEnum.catecashDevnetChainName,
      switchWallet,
    );
    fireEvent.press(screen.getByTestId('server.net.catecash-devnet'));
    expect(navigation.navigate).toHaveBeenCalledWith(Route.Home);
    expect(switchWallet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'w2' }),
    );
  } finally {
    appName.mockReturnValue('Zingo');
  }
});

test('Tests that Automatic on the wallet’s network reconnects the wallet and stays', async () => {
  (pickAutomatic as jest.Mock).mockResolvedValue({
    server: {
      uri: 'https://na.zec.rocks:443',
      chainName: ChainNameEnum.mainChainName,
    },
    tier: 'registry',
  });
  const setServerOption = jest.fn().mockResolvedValue({ kind: 'ok' });
  const navigation = mount(setServerOption);
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.auto'));
  });
  expect(setServerOption).toHaveBeenCalledWith(
    remoteServer('https://na.zec.rocks:443', ChainNameEnum.mainChainName),
    SelectServerEnum.auto,
    true,
  );
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('Tests that the network stays the wallet’s when another network is tapped', async () => {
  (pickAutomatic as jest.Mock).mockResolvedValue({
    server: {
      uri: 'https://zec.rocks:443',
      chainName: ChainNameEnum.mainChainName,
    },
    tier: 'registry',
  });
  const setServerOption = jest.fn().mockResolvedValue({ kind: 'ok' });
  const navigation = mount(setServerOption);
  fireEvent.press(
    screen.getByTestId(`server.net.${ChainNameEnum.testChainName}`),
  );
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.auto'));
  });
  expect(pickAutomatic).toHaveBeenCalledWith(
    expect.anything(),
    ChainNameEnum.mainChainName,
    expect.anything(),
  );
  expect(setServerOption).toHaveBeenCalledWith(
    remoteServer('https://zec.rocks:443', ChainNameEnum.mainChainName),
    SelectServerEnum.auto,
    true,
  );
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('Tests that nothing holds the back when nothing is unsaved, and the back arrow leaves', async () => {
  const preventRemove = usePreventRemove as jest.Mock;
  preventRemove.mockClear();
  const navigation = mount(jest.fn());
  const calls = preventRemove.mock.calls;
  expect(calls[calls.length - 1][0]).toBe(false);
  // Nothing held: iOS's native swipe stays on.
  expect(navigation.setOptions).toHaveBeenLastCalledWith({
    gestureEnabled: true,
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.back'));
  });
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});

test('Tests that a server picked for another wallet is kept in its meta without reconnecting the open one', async () => {
  (pickAutomatic as jest.Mock).mockResolvedValue({
    server: {
      uri: 'https://zec.rocks:443',
      chainName: ChainNameEnum.mainChainName,
    },
    tier: 'registry',
  });
  const setServerOption = jest.fn();
  mount(setServerOption, 'w2');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.auto'));
  });
  expect(SettingsFileImpl.writeWalletServer).toHaveBeenCalledWith(
    'w2',
    remoteServer('https://zec.rocks:443', ChainNameEnum.mainChainName),
    SelectServerEnum.auto,
  );
  expect(setServerOption).not.toHaveBeenCalled();
});
