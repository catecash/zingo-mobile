import 'react-native';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  ChainNameEnum,
  SelectServerEnum,
  ServerUrisType,
  TranslateType,
} from '@app/AppState';
import { offlineServer, remoteServer } from '@app/AppState/types/ServerType';
import Server from '@screens/Server';
import ServerList from '@screens/ServerList';
import { probeServer } from '@app/walletBackend';
import { getApplicationName } from 'react-native-device-info';

jest.mock('@app/walletBackend', () => ({ probeServer: jest.fn() }));

const en = require('../app/translations/en.json');
const translate = (key: string): TranslateType =>
  key.split('.').reduce((o, k) => o?.[k], en) ?? key;
const probe = probeServer as jest.Mock;
const appName = getApplicationName as jest.Mock;

const entry = (
  uri: string,
  chainName: ChainNameEnum,
  recommended = false,
): ServerUrisType => ({
  uri,
  chainName,
  region: 'Global',
  default: false,
  latency: null,
  obsolete: false,
  recommended,
});

const recommended = [
  entry('https://sa.zaino.example:443', ChainNameEnum.mainChainName, true),
  entry('https://na.zaino.example:443', ChainNameEnum.mainChainName, true),
];
const others = [
  entry('https://zec.rocks:443', ChainNameEnum.mainChainName),
  entry('https://na.zec.rocks:443', ChainNameEnum.mainChainName),
];

const handlers = () => ({
  onAuto: jest.fn(),
  onPick: jest.fn(),
  onSaveCustom: jest.fn().mockResolvedValue(true),
  onOffline: jest.fn(),
  onOther: jest.fn(),
  onProbe: jest.fn(),
  onUnreachable: jest.fn(),
  onBack: jest.fn(),
});

const mount = (
  props: Partial<React.ComponentProps<typeof Server>>,
  h = handlers(),
) =>
  render(
    <Server
      translate={translate}
      server={remoteServer(
        'https://sa.zaino.example:443',
        ChainNameEnum.mainChainName,
      )}
      selectServer={SelectServerEnum.auto}
      status="ok"
      blockHeight="3473752"
      busy={false}
      online={true}
      recommended={recommended}
      latencies={{
        'https://sa.zaino.example:443': 38,
        'https://na.zaino.example:443': null,
      }}
      {...h}
      {...props}
    />,
  );

const verified = (chainName = 'main') => ({
  ok: true,
  value: {
    outcome: 'verified',
    host: 'node.myhome.net',
    port: 9067,
    resolved: ['198.51.100.7'],
    literal: false,
    latencyMs: 120,
    chainName,
    blockHeight: 3473752,
    details: 'LightdInfo { .. }',
  },
});

const typeCustom = (text: string) => {
  fireEvent.press(screen.getByTestId('server.custom'));
  fireEvent.changeText(screen.getByTestId('server.custom.host'), text);
};

beforeEach(() => {
  probe.mockReset();
  appName.mockReturnValue('Zingo');
});

test('Tests that Automatic and the recommended servers are on the main screen and Other servers drills in', () => {
  const h = handlers();
  mount({}, h);
  expect(screen.getByText('Fastest right now: sa.zaino.example')).toBeTruthy();
  expect(screen.getByTestId('server.pick.na.zaino.example')).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('server.other'));
  expect(h.onOther).toHaveBeenCalledWith(ChainNameEnum.mainChainName);
  expect(h.onProbe).toHaveBeenLastCalledWith(ChainNameEnum.mainChainName);
});

test('Tests that a recommended server that did not answer shakes instead of being picked', () => {
  const h = handlers();
  mount({}, h);
  fireEvent.press(screen.getByTestId('server.pick.na.zaino.example'));
  expect(h.onUnreachable).toHaveBeenCalledTimes(1);
  expect(h.onPick).not.toHaveBeenCalled();
});

test('Tests that a recommended server that answered is picked', () => {
  const h = handlers();
  mount(
    {
      latencies: {
        'https://sa.zaino.example:443': 38,
        'https://na.zaino.example:443': 96,
      },
    },
    h,
  );
  fireEvent.press(screen.getByTestId('server.pick.na.zaino.example'));
  expect(h.onPick).toHaveBeenCalledWith(recommended[1]);
});

test('Tests that the rows are locked and the switch turns offline off when the app is offline', () => {
  const h = handlers();
  mount({ server: offlineServer(ChainNameEnum.mainChainName) }, h);
  fireEvent.press(screen.getByTestId('server.other'));
  expect(h.onOther).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('server.offline'));
  expect(h.onOffline).toHaveBeenCalledWith(false, ChainNameEnum.mainChainName);
});

test('Catecash devnet accepts a matching local server from an offline wallet', async () => {
  const h = handlers();
  probe.mockResolvedValue(verified('catecash-devnet'));
  mount(
    {
      server: offlineServer(ChainNameEnum.catecashDevnetChainName),
      initialChain: ChainNameEnum.catecashDevnetChainName,
    },
    h,
  );
  expect(screen.getByText('Your Catecash Devnet server')).toBeOnTheScreen();
  expect(screen.queryByTestId('server.auto')).toBeNull();
  fireEvent.changeText(screen.getByTestId('server.custom.host'), '127.0.0.1');
  fireEvent.changeText(screen.getByTestId('server.custom.port'), '9067');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.save'));
  });
  expect(probe).toHaveBeenCalledWith('http://127.0.0.1:9067');
  expect(h.onSaveCustom).toHaveBeenCalledWith(
    ChainNameEnum.catecashDevnetChainName,
    'http://127.0.0.1:9067',
  );
});

test('Catecash devnet uses TLS for a public server', async () => {
  const h = handlers();
  probe.mockResolvedValue(verified('catecash-devnet'));
  mount(
    {
      server: offlineServer(ChainNameEnum.catecashDevnetChainName),
      initialChain: ChainNameEnum.catecashDevnetChainName,
    },
    h,
  );
  fireEvent.changeText(
    screen.getByTestId('server.custom.host'),
    '157.90.173.220',
  );
  fireEvent.changeText(screen.getByTestId('server.custom.port'), '443');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.save'));
  });
  expect(probe).toHaveBeenCalledWith('https://157.90.173.220:443');
  expect(h.onSaveCustom).toHaveBeenCalledWith(
    ChainNameEnum.catecashDevnetChainName,
    'https://157.90.173.220:443',
  );
});

test('Tests that Catecash selects its testnet gateway when Testnet is pressed', () => {
  appName.mockReturnValue('Catecash');
  const h = handlers();
  mount(
    {
      server: remoteServer(
        'https://wallet-devnet.catecash.com:443',
        ChainNameEnum.catecashDevnetChainName,
      ),
      initialChain: ChainNameEnum.catecashDevnetChainName,
      recommended: [
        entry(
          'https://wallet-testnet.catecash.com:443',
          ChainNameEnum.catecashTestnetChainName,
          true,
        ),
      ],
    },
    h,
  );
  const mainnet = screen.getByTestId('server.net.catecash-mainnet');
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(mainnet.props.accessibilityState.disabled).not.toBe(true);
  expect(testnet.props.accessibilityState.disabled).not.toBe(true);
  fireEvent.press(testnet);
  expect(h.onAuto).toHaveBeenCalledWith(ChainNameEnum.catecashTestnetChainName);
  expect(
    screen.getByTestId('server.net.catecash-testnet').props.accessibilityState
      .selected,
  ).toBe(true);
  expect(screen.getByText('wallet-testnet.catecash.com')).toBeOnTheScreen();
  expect(screen.queryByTestId('server.net.test')).toBeNull();
});

test('Tests that Catecash selects its mainnet gateway when Mainnet is pressed', () => {
  appName.mockReturnValue('Catecash');
  const h = handlers();
  mount(
    {
      server: remoteServer(
        'https://wallet-testnet.catecash.com:443',
        ChainNameEnum.catecashTestnetChainName,
      ),
      initialChain: ChainNameEnum.catecashTestnetChainName,
      recommended: [
        entry(
          'https://wallet.catecash.com:443',
          ChainNameEnum.catecashMainnetChainName,
          true,
        ),
      ],
    },
    h,
  );
  fireEvent.press(screen.getByTestId('server.net.catecash-mainnet'));
  expect(h.onAuto).toHaveBeenCalledWith(ChainNameEnum.catecashMainnetChainName);
  expect(screen.getByText('wallet.catecash.com')).toBeOnTheScreen();
});

test('Tests that Testnet opens wallet creation when the current Catecash wallet is fixed to Devnet', () => {
  appName.mockReturnValue('Catecash');
  const h = handlers();
  const onSwitchNetwork = jest.fn();
  mount(
    {
      server: remoteServer(
        'https://wallet-devnet.catecash.com:443',
        ChainNameEnum.catecashDevnetChainName,
      ),
      networkLocked: true,
      onSwitchNetwork,
    },
    h,
  );
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(testnet.props.accessibilityState.disabled).not.toBe(true);
  fireEvent.press(testnet);
  expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
  expect(h.onAuto).not.toHaveBeenCalled();
  expect(
    screen.getByTestId('server.net.catecash-devnet').props.accessibilityState
      .selected,
  ).toBe(true);
});

test('Tests that Testnet opens wallet creation when the Devnet wallet is offline', () => {
  appName.mockReturnValue('Catecash');
  const onSwitchNetwork = jest.fn();
  mount(
    {
      server: offlineServer(ChainNameEnum.catecashDevnetChainName),
      networkLocked: true,
      onSwitchNetwork,
    },
  );
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(testnet.props.accessibilityState.disabled).toBe(false);
  fireEvent.press(testnet);
  expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
});

test('Tests that a Devnet wallet can open Testnet when its saved server has another chain', () => {
  appName.mockReturnValue('Catecash');
  const onSwitchNetwork = jest.fn();
  mount({
    server: remoteServer(
      'https://old.example:443',
      ChainNameEnum.mainChainName,
    ),
    initialChain: ChainNameEnum.catecashDevnetChainName,
    networkLocked: true,
    onSwitchNetwork,
  });
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(testnet.props.accessibilityState.disabled).toBe(false);
  fireEvent.press(testnet);
  expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
});

test('Tests that the Catecash Testnet wallet flow remains available when the current wallet chain is unknown', () => {
  appName.mockReturnValue('Catecash');
  const onSwitchNetwork = jest.fn();
  mount({
    server: remoteServer('https://old.example:443', ChainNameEnum.mainChainName),
    initialChain: ChainNameEnum.noneChainName,
    networkLocked: true,
    onSwitchNetwork,
  });
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(testnet.props.accessibilityState.disabled).toBe(false);
  fireEvent.press(testnet);
  expect(onSwitchNetwork).toHaveBeenCalledTimes(1);
});

test('Tests that a Testnet wallet shows Testnet as its selected network when its server has another chain', () => {
  appName.mockReturnValue('Catecash');
  mount({
    server: remoteServer(
      'https://old.example:443',
      ChainNameEnum.catecashDevnetChainName,
    ),
    initialChain: ChainNameEnum.catecashTestnetChainName,
    networkLocked: true,
    onSwitchNetwork: jest.fn(),
  });
  const testnet = screen.getByTestId('server.net.catecash-testnet');
  expect(testnet.props.accessibilityState.selected).toBe(true);
  expect(testnet.props.accessibilityState.disabled).toBe(false);
});

test('Tests that Devnet opens the network switch when the current Catecash wallet uses Testnet', () => {
  appName.mockReturnValue('Catecash');
  const onSwitchNetwork = jest.fn();
  mount({
    server: remoteServer(
      'https://wallet-testnet.catecash.com:443',
      ChainNameEnum.catecashTestnetChainName,
    ),
    initialChain: ChainNameEnum.catecashTestnetChainName,
    networkLocked: true,
    onSwitchNetwork,
  });
  const devnet = screen.getByTestId('server.net.catecash-devnet');
  expect(devnet.props.accessibilityState.disabled).toBe(false);
  fireEvent.press(devnet);
  expect(onSwitchNetwork).toHaveBeenCalledWith(
    ChainNameEnum.catecashDevnetChainName,
  );
});

test('Tests that an offline Catecash wallet draft selects Testnet', () => {
  appName.mockReturnValue('Catecash');
  const h = handlers();
  mount(
    {
      server: offlineServer(ChainNameEnum.catecashDevnetChainName),
    },
    h,
  );
  fireEvent.press(screen.getByTestId('server.net.catecash-testnet'));
  expect(h.onAuto).toHaveBeenCalledWith(ChainNameEnum.catecashTestnetChainName);
});

test('Tests that a Catecash wallet draft can return from Testnet to Devnet', () => {
  appName.mockReturnValue('Catecash');
  const h = handlers();
  mount(
    {
      server: remoteServer(
        'https://wallet-testnet.catecash.com:443',
        ChainNameEnum.catecashTestnetChainName,
      ),
    },
    h,
  );
  fireEvent.press(screen.getByTestId('server.net.catecash-devnet'));
  expect(h.onAuto).toHaveBeenCalledWith(ChainNameEnum.catecashDevnetChainName);
});

test('Tests that pasting a full address splits it into host and port', () => {
  mount({});
  typeCustom('https://node.myhome.net:9067');
  expect(screen.getByTestId('server.custom.host').props.value).toBe(
    'node.myhome.net',
  );
  expect(screen.getByTestId('server.custom.port').props.value).toBe('9067');
});

test('Tests that typing a scheme drops it and a colon after the host moves to the port', () => {
  mount({});
  fireEvent.press(screen.getByTestId('server.custom'));
  const typed = 'https://na.zec.rocks:';
  for (let i = 1; i <= typed.length; i++) {
    const field = screen.getByTestId('server.custom.host');
    fireEvent.changeText(field, field.props.value + typed[i - 1]);
  }
  expect(screen.getByTestId('server.custom.host').props.value).toBe(
    'na.zec.rocks',
  );
  fireEvent.changeText(screen.getByTestId('server.custom.port'), '443');
  expect(screen.getByTestId('server.custom.port').props.value).toBe('443');
});

test('Tests that a passing test logs each step and asks to save, without switching', async () => {
  const h = handlers();
  probe.mockResolvedValue(verified());
  mount({}, h);
  typeCustom('node.myhome.net:9067');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.test'));
  });
  expect(probe).toHaveBeenCalledWith('https://node.myhome.net:9067');
  expect(screen.getByText('Testing node.myhome.net:9067…')).toBeTruthy();
  expect(screen.getByText('DNS resolved to 198.51.100.7')).toBeTruthy();
  expect(screen.getByText('GetLightdInfo responded in 120 ms')).toBeTruthy();
  expect(
    screen.getByText('Endpoint verified: Mainnet, block 3,473,752'),
  ).toBeTruthy();
  expect(
    screen.getByText('Works, but it isn’t saved yet. Tap Save to use it.'),
  ).toBeTruthy();
  expect(h.onSaveCustom).not.toHaveBeenCalled();
});

test('Tests that Save tests first and hands the server over once it passed', async () => {
  const h = handlers();
  probe.mockResolvedValue(verified());
  mount({}, h);
  typeCustom('node.myhome.net:9067');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.save'));
  });
  expect(probe).toHaveBeenCalledTimes(1);
  expect(h.onSaveCustom).toHaveBeenCalledWith(
    ChainNameEnum.mainChainName,
    'https://node.myhome.net:9067',
  );
  expect(
    screen.getByText('Saved! Zingo is now using node.myhome.net.'),
  ).toBeTruthy();
});

test('Tests that a server on another network fails the test and offers to switch', async () => {
  const h = handlers();
  probe.mockResolvedValue(verified('test'));
  mount({}, h);
  typeCustom('node.myhome.net:9067');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.save'));
  });
  expect(h.onSaveCustom).not.toHaveBeenCalled();
  expect(screen.getByText('chainName is “test”, expected “main”')).toBeTruthy();
  expect(screen.getByText('Not saved.')).toBeTruthy();
  expect(screen.getByTestId('server.custom.switch')).toBeOnTheScreen();
});

test('Tests that an empty port box hands zingolib a portless address to complete', async () => {
  probe.mockResolvedValue(verified());
  mount({});
  typeCustom('node.myhome.net');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.test'));
  });
  expect(probe).toHaveBeenCalledWith('https://node.myhome.net');
  expect(screen.getByText('Testing node.myhome.net…')).toBeTruthy();
});

test('Tests that a host that does not resolve says what to fix', async () => {
  probe.mockResolvedValue({
    ok: true,
    value: {
      outcome: 'unresolved',
      host: 'down.example',
      port: 9067,
      cause: 'no such host',
    },
  });
  mount({});
  typeCustom('down.example:9067');
  await act(async () => {
    fireEvent.press(screen.getByTestId('server.custom.test'));
  });
  expect(screen.getByText('Couldn’t resolve down.example')).toBeTruthy();
  expect(screen.getByText('Check the host for typos.')).toBeTruthy();
});

test('Tests that leaving with an unsaved address asks first, and Don’t Save leaves', async () => {
  const h = handlers();
  mount({}, h);
  typeCustom('node.myhome.net:9067');
  fireEvent.press(screen.getByTestId('server.done'));
  expect(h.onBack).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByTestId('server.unsaved')).toBeOnTheScreen(),
  );
  expect(
    screen.getByText(
      'You haven’t saved node.myhome.net. Saving tests it first. If you leave now, Zingo keeps using sa.zaino.example (automatic).',
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByTestId('server.unsaved.discard'));
  expect(h.onBack).toHaveBeenCalledTimes(1);
});

test('Tests that a saved custom server reads as saved and leaves without asking', () => {
  const h = handlers();
  mount(
    {
      server: remoteServer(
        'https://node.myhome.net:9067',
        ChainNameEnum.mainChainName,
      ),
      selectServer: SelectServerEnum.custom,
    },
    h,
  );
  expect(screen.getByText('Saved')).toBeTruthy();
  expect(screen.getByText('Saved. Zingo is using this server.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('server.back'));
  expect(h.onBack).toHaveBeenCalledTimes(1);
});

test('Tests that a server that did not answer is refused and a reachable one is picked in Other servers', () => {
  const onPick = jest.fn();
  const onUnreachable = jest.fn();
  render(
    <ServerList
      translate={translate}
      servers={others}
      latencies={{
        'https://zec.rocks:443': null,
        'https://na.zec.rocks:443': 142,
      }}
      selectedUri={null}
      loading={false}
      busy={false}
      onPick={onPick}
      onUnreachable={onUnreachable}
      onBack={jest.fn()}
    />,
  );
  expect(screen.getByText('Other servers')).toBeTruthy();
  fireEvent.press(screen.getByTestId('serverlist.pick.zec.rocks:443'));
  expect(onUnreachable).toHaveBeenCalledTimes(1);
  expect(onPick).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('serverlist.pick.na.zec.rocks:443'));
  expect(onPick).toHaveBeenCalledWith(others[1]);
});

test('Tests that the screen opens on the network it is asked for', () => {
  const h = handlers();
  mount({ initialChain: ChainNameEnum.testChainName }, h);
  expect(
    screen.getByTestId(`server.net.${ChainNameEnum.testChainName}`).props
      .accessibilityState.selected,
  ).toBe(true);
  expect(h.onProbe).toHaveBeenLastCalledWith(ChainNameEnum.testChainName);
});
