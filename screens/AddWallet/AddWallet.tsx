/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChainNameEnum, Route, SelectServerEnum } from '@app/AppState';
import { offlineServer, remoteServer } from '@app/AppState/types/ServerType';
import { serverUris } from '@app/uris';
import { ContextAppLoaded } from '@app/context';
import { AppDrawerParamList } from '@app/types';
import { space8, space16, space20, useTheme } from '@app/theme';
import SettingsFileImpl from '@app/services/SettingsFileImpl';
import { setAddWalletDraft } from '@app/services/addWalletDraft';
import { isCatecashApp } from '@app/utils/ZingoAppData';
import { recoveryEntriesOnDevice } from '@app/services/recoveryWalletInfo';
import { HistoryIcon } from '@ui/primitives/Icons/HistoryIcon';
import Text from '@ui/primitives/Text';
import { ChevronLeft } from '@ui/primitives/Icons/Chevron';
import { SnowflakeIcon } from '@ui/primitives/Icons/SnowflakeIcon';
import { SproutIcon } from '@ui/primitives/Icons/SproutIcon';
import { WalletIcon } from '@ui/primitives/Icons/WalletIcon';
import OptionCard from '@ui/widgets/OptionCard';
import TitleBar from '@ui/widgets/TitleBar';
import { useScrollEdges } from '@ui/widgets/ScrollEdges';

type AddWalletProps = NativeStackScreenProps<AppDrawerParamList, 'AddWallet'>;

/** Where a new wallet comes from: made here, or restored from a seed phrase or a viewing key. */
const AddWallet: React.FC<AddWalletProps> = ({ navigation, route }) => {
  const { translate } = useContext(ContextAppLoaded);
  const t = (key: string) => translate(key) as string;
  const { colors } = useTheme();
  const { edges, fades } = useScrollEdges();
  const [found, setFound] = useState(0);

  useEffect(() => {
    recoveryEntriesOnDevice().then(entries => setFound(entries.length));
  }, []);

  /** A new wallet starts on the server the next one defaults to. */
  useEffect(() => {
    if (
      route.params?.initialChain === ChainNameEnum.catecashDevnetChainName ||
      route.params?.initialChain === ChainNameEnum.catecashTestnetChainName ||
      route.params?.initialChain === ChainNameEnum.catecashMainnetChainName
    ) {
      const chain = route.params.initialChain;
      const gateway = serverUris(() => {}).find(
        s => s.chainName === chain && s.default,
      )!;
      setAddWalletDraft({
        server: remoteServer(gateway.uri, chain),
        selectServer: SelectServerEnum.auto,
        keyChain: { kind: 'none' },
      });
      return;
    }
    SettingsFileImpl.serverOf({}).then(({ server, selectServer }) => {
      const catecashDefault =
        isCatecashApp() &&
        server.chainName !== ChainNameEnum.catecashDevnetChainName &&
        server.chainName !== ChainNameEnum.catecashTestnetChainName &&
        server.chainName !== ChainNameEnum.catecashMainnetChainName;
      setAddWalletDraft({
        server: catecashDefault
          ? remoteServer(
              serverUris(() => {}).find(
                s => s.chainName === ChainNameEnum.catecashMainnetChainName && s.default,
              )!.uri,
              ChainNameEnum.catecashMainnetChainName,
            )
          : server,
        selectServer: catecashDefault ? SelectServerEnum.custom : selectServer,
        keyChain: { kind: 'none' },
      });
    });
  }, [route.params?.initialChain]);

  const group = (label: string, first: boolean) => (
    <Text
      variant="bodySmall"
      tone="muted"
      style={{
        fontWeight: '600',
        marginTop: first ? space16 : space20,
        marginBottom: space8,
        marginHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <TitleBar
        title={t('add.title')}
        left={{
          icon: ChevronLeft,
          accent: true,
          accessibilityLabel: t('wallets.title'),
          onPress: () => navigation.goBack(),
          testID: 'addwallet.back',
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        {...edges}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space20, paddingTop: 8 }}
      >
        <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('add.others-stay')}
        </Text>
        {group(t('add.group-new'), true)}
        <OptionCard
          testID="addwallet.create"
          icon={WalletIcon}
          iconBg={colors.bgAccentSubtle}
          iconColor={colors.fgAccent}
          title={t('add.create')}
          sub={t('add.create-sub')}
          subColor={colors.fgMuted}
          disabled={false}
          onPress={() => navigation.navigate(Route.NewWallet)}
        />
        {group(t('add.group-restore'), false)}
        <OptionCard
          testID="addwallet.seed"
          icon={SproutIcon as never}
          iconBg={colors.bgAccentSubtle}
          iconColor={colors.fgAccent}
          title={t('add.seed')}
          sub={t('add.seed-sub')}
          subColor={colors.fgMuted}
          disabled={false}
          onPress={() =>
            navigation.navigate(Route.RestoreWallet, { mode: 'seed' })
          }
        />
        <View style={{ height: space8 }} />
        <OptionCard
          testID="addwallet.key"
          icon={SnowflakeIcon}
          iconBg={colors.bgViewOnlySubtle}
          iconColor={colors.fgViewOnly}
          title={t('add.key')}
          sub={t('add.key-sub')}
          subColor={colors.fgMuted}
          disabled={false}
          onPress={() =>
            navigation.navigate(Route.RestoreWallet, { mode: 'key' })
          }
        />
        {found > 0 && (
          <>
            <View style={{ height: space8 }} />
            <OptionCard
              testID="addwallet.found"
              icon={HistoryIcon}
              iconBg={colors.bgAccentSubtle}
              iconColor={colors.fgAccent}
              title={t('wallets.previous')}
              sub={
                found === 1
                  ? t('wallets.previous-sub-one')
                  : t('wallets.previous-sub').replace('{n}', String(found))
              }
              subColor={colors.fgMuted}
              disabled={false}
              onPress={() => navigation.navigate(Route.FoundWallets)}
            />
          </>
        )}
      </ScrollView>
      {fades}
    </View>
  );
};

export default AddWallet;
