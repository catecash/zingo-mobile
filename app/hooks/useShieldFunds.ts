import { useCallback, useEffect, useState } from 'react';
import { showConfirm } from '@app/services/showConfirm';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { WalletNavigation } from '@app/types';
import {
  PoolToShieldEnum,
  Route,
  ServerType,
  SnackbarDurationEnum,
  TranslateType,
} from '@app/AppState';
import { TotalBalanceClass } from '@app/wallet/classes';
import {
  shieldConfirm,
  shieldPreview,
  shieldPropose,
} from '@app/walletBackend';
import { RPCShieldProposeType } from '@app/walletBackend/types/RPCShieldProposeType';
import {
  ComputingSubject,
  nowSeconds,
  shieldEnd,
} from '@app/walletBackend/transforms/sendSettlement';
import { isOnTop } from '@app/navigation/navigate';
import { formatAmount } from '@app/utils/formatAmount';
import { withSyncStopped } from '@app/walletBackend/utils/syncBracket';
import { SendPermit } from '@app/walletBackend/transforms/sendPermit';

type UseShieldFundsInput = {
  readOnly: boolean;
  setShieldingAmount: ((value: number) => void) | undefined;
  server: ServerType;
  chainHeight: number;
  totalBalance: TotalBalanceClass | null;
  shieldingAmount: number;
  translate: (key: string) => TranslateType;
  addLastSnackbar:
    ((msg: string, duration?: SnackbarDurationEnum) => void) | undefined;
  setBackgroundError: ((title: string, err: string) => void) | undefined;
  setScrollToTop: ((v: boolean) => void) | undefined;
  setScrollToBottom: ((v: boolean) => void) | undefined;
  sendPermitNow: () => SendPermit;
};

type UseShieldFundsResult = {
  showShieldButton: boolean;
  shieldingFee: number;
  onPressShieldFunds: () => void;
  /** Shields at once, for a caller that asked in its own sheet. */
  shieldNow: () => Promise<void>;
  calculatePoolsToShield: () => string;
  calculateDisableButtonToShield: () => boolean;
};

/**
 * Orchestrates the transparent-pool shielding flow.
 *
 * Previews shielding when the balance or chain height changes to calculate the
 * fee and shieldable amount. Exposes `onPressShieldFunds` which shows a
 * confirmation alert then executes the shield transaction via RPC, navigates
 * to the Computing screen while work is in progress, and returns to History on
 * success.
 *
 * `showShieldButton` follows the latest spendable shield proposal.
 */
export function useShieldFunds({
  readOnly,
  setShieldingAmount,
  server,
  chainHeight,
  totalBalance,
  shieldingAmount,
  translate,
  addLastSnackbar,
  setBackgroundError,
  setScrollToTop,
  setScrollToBottom,
  sendPermitNow,
}: UseShieldFundsInput): UseShieldFundsResult {
  const navigation = useNavigation<WalletNavigation>();
  const focused = useIsFocused();
  const [showShieldButton, setShowShieldButton] = useState<boolean>(false);
  const [shieldingFee, setShieldingFee] = useState<number>(0);
  useEffect(() => {
    // A newer balance or block asks again; an older answer is dropped.
    let cancelled = false;
    if (!focused) {
      return () => {
        cancelled = true;
      };
    }
    if (
      !readOnly &&
      !!setShieldingAmount &&
      server.kind !== 'offline' &&
      (totalBalance?.totalTransparentBalance ?? 0) > 0
    ) {
      (async () => {
        let proposeFee = 0;
        let proposeAmount = 0;
        const runPropose = await shieldPreview();
        if (cancelled) {
          return;
        }
        if (!runPropose.ok) {
          console.log('Error shield proposing', runPropose.error.message);
          return;
        }
        try {
          const runProposeJson: RPCShieldProposeType = JSON.parse(
            runPropose.value,
          );
          if (runProposeJson.error) {
            console.log('Error shield proposing', runProposeJson.error);
            return;
          }
          if (runProposeJson.fee) {
            proposeFee = runProposeJson.fee / 10 ** 8;
          }
          if (runProposeJson.value_to_shield) {
            proposeAmount = runProposeJson.value_to_shield / 10 ** 8;
          }
        } catch (e) {
          console.log('Error shield proposing', e);
          return;
        }
        setShieldingFee(proposeFee);
        setShieldingAmount(proposeAmount);
      })();
    } else {
      setShieldingFee(0);
      setShieldingAmount?.(0);
    }
    return () => {
      cancelled = true;
    };
  }, [
    focused,
    readOnly,
    setShieldingAmount,
    totalBalance?.confirmedTransparentBalance,
    totalBalance?.totalTransparentBalance,
    chainHeight,
    server,
  ]);

  useEffect(() => {
    setShowShieldButton(
      !readOnly &&
        server.kind !== 'offline' &&
        shieldingAmount > 0,
    );
  }, [readOnly, shieldingAmount, server]);

  const handleShieldFunds = useCallback(async () => {
    if (!setBackgroundError || !addLastSnackbar) {
      return;
    }
    const permit = sendPermitNow();
    if (permit.kind === 'error') {
      addLastSnackbar(translate(permit.errorKey) as string);
      return;
    }

    const subject: ComputingSubject = {
      amount: formatAmount(shieldingAmount),
      who: translate('send.shield-who') as string,
      kind: 'shield',
      pair: false,
    };
    const since = nowSeconds();
    navigation.navigate(Route.Computing, { subject });
    // `confirm` transmits whatever proposal is stored, so it runs only on
    // the one this shield just stored; a failed propose ends with its own error.
    const shield = await withSyncStopped(async () => {
      const proposed = await shieldPropose();
      return proposed.ok ? shieldConfirm() : proposed;
    });

    setScrollToTop?.(true);
    setScrollToBottom?.(true);
    const end = shieldEnd(shield, since);
    if (end.phase === 'created') {
      setShieldingFee(0);
      setShieldingAmount?.(0);
    }
    if (isOnTop(Route.Computing)) {
      navigation.navigate(Route.Computing, { ...end, subject });
    } else if (end.phase === 'failed') {
      addLastSnackbar(translate('send.shield-failed-away') as string);
    }
  }, [
    setBackgroundError,
    addLastSnackbar,
    sendPermitNow,
    translate,
    navigation,
    shieldingAmount,
    setScrollToTop,
    setScrollToBottom,
    setShieldingAmount,
  ]);

  const calculatePoolsToShield = useCallback(
    (): string => PoolToShieldEnum.transparentPoolToShield,
    [],
  );

  const calculateDisableButtonToShield = useCallback(
    (): boolean => shieldingAmount <= 0,
    [shieldingAmount],
  );

  const onPressShieldFunds = useCallback(() => {
    const pools = calculatePoolsToShield();
    showConfirm({
      title: translate(`history.shield-title-${pools}`) as string,
      message: translate(`history.shield-alert-${pools}`) as string,
      buttons: [
        { text: translate('confirm') as string, onPress: handleShieldFunds },
        { text: translate('cancel') as string, style: 'cancel' },
      ],
    });
  }, [translate, calculatePoolsToShield, handleShieldFunds]);

  return {
    showShieldButton,
    shieldingFee,
    onPressShieldFunds,
    shieldNow: handleShieldFunds,
    calculatePoolsToShield,
    calculateDisableButtonToShield,
  };
}
