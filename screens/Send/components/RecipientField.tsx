/* eslint-disable react-native/no-inline-styles */
import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { iconSizeSm, space4, space8, space12, useTheme } from '@app/theme';
import Pressable from '@ui/primitives/Pressable';
import { AddressBookFileClass, ChainNameEnum } from '@app/AppState';
import { ContextAppLoaded } from '@app/context';
import Utils from '@app/utils';
import Text from '@ui/primitives/Text';
import TextField, { FieldAction } from '@ui/primitives/TextField';
import ListRow from '@ui/primitives/ListRow';
import Button from '@ui/primitives/Button';
import Card from '@ui/widgets/Card';
import Avatar, { avatarCategoryOf } from '@ui/widgets/Avatar';
import { XIcon } from '@ui/primitives/Icons/XIcon';
import { ScanIcon } from '@ui/primitives/Icons/ScanIcon';
import { ClipboardPasteIcon } from '@ui/primitives/Icons/ClipboardPasteIcon';
import { ContactIcon } from '@ui/primitives/Icons/ContactIcon';
import { CheckIcon } from '@ui/primitives/Icons/CheckIcon';
import { TriangleAlert } from '@ui/primitives/Icons/TriangleAlert';

/** The catalog key naming a Zcash address kind, from its prefix. */
export const kindKey = (address: string): string =>
  /^tex/i.test(address)
    ? 'addressbook.kind-tex'
    : /^t/i.test(address)
      ? 'addressbook.kind-transparent'
      : /^zs/i.test(address)
        ? 'addressbook.kind-sapling'
        : 'addressbook.kind-unified';

type RecipientFieldProps = {
  text: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  /** 1 a valid address, 0 nothing to judge yet, -1 not an address or contact. */
  valid: number;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  /** The saved contact the address belongs to, when it is one. */
  contact: AddressBookFileClass | undefined;
  /** Contacts whose name starts with what is typed. */
  matches: AddressBookFileClass[];
  onPickContact: (contact: AddressBookFileClass) => void;
  onOpenBook: () => void;
  onScan: () => void;
  scanRef: React.RefObject<View | null>;
  onSaveContact: () => void;
  /** The book button is off while the field is being replaced. */
  busy: boolean;
};

/**
 * The To field of Send: an address or a contact. A contact becomes a token
 * with its avatar, name and short address. Matching contacts appear under
 * the field; a pasted address says its kind, and a transparent one warns
 * that the payment will be public.
 */
export default function RecipientField({
  text,
  onChangeText,
  onClear,
  valid,
  focused,
  onFocus,
  onBlur,
  contact,
  matches,
  onPickContact,
  onOpenBook,
  onScan,
  scanRef,
  onSaveContact,
  busy,
}: RecipientFieldProps) {
  const { translate, walletChainName } = useContext(ContextAppLoaded);
  const { colors } = useTheme();
  const t = (key: string) => (translate(key) as string).trim();
  const catecash =
    walletChainName === ChainNameEnum.catecashDevnetChainName ||
    walletChainName === ChainNameEnum.catecashTestnetChainName ||
    walletChainName === ChainNameEnum.catecashMainnetChainName;
  const token = valid === 1 && !!contact;
  /** Tapped while shortened: the input comes back and takes the focus. */
  const [editing, setEditing] = useState(false);
  /**
   * A valid address not being edited reads in one line, shortened in the
   * middle so its start and end show; a tap brings the input back.
   */
  const shortened =
    valid === 1 && !token && !!text && !focused && !editing ? (
      <Pressable
        kind="row"
        // The input's own id: Maestro taps it and types into the input it brings back.
        testID="send.addressplaceholder"
        accessibilityRole="button"
        accessibilityLabel={t('send.address-acc')}
        onPress={() => setEditing(true)}
        style={{ flex: 1, paddingVertical: space12 }}
      >
        <Text variant="address" numberOfLines={1} ellipsizeMode="middle">
          {text}
        </Text>
      </Pressable>
    ) : undefined;
  const transparent = valid === 1 && /^t/i.test(text);
  const searching = matches.length > 0;

  const avatarFor = (name: string, color?: string) => (
    <Avatar
      kind="contact"
      name={name}
      category={avatarCategoryOf(color ?? name)}
      size="md"
    />
  );

  const line = (icon: React.ReactNode, words: React.ReactNode) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space8 }}>
      {icon}
      {words}
    </View>
  );

  const saveContact = (
    <View style={{ marginLeft: 'auto' }}>
      <Button
        testID="send.add-address"
        variant="text"
        size="small"
        inline
        title={t('swap.save-contact')}
        onPress={onSaveContact}
      />
    </View>
  );

  const footer =
    valid !== 1 || token
      ? undefined
      : transparent
        ? line(
            <TriangleAlert size={iconSizeSm} color={colors.fgTransparent} />,
            <>
              <Text
                testID="send.address.transparent"
                variant="bodySmall"
                color={colors.fgTransparent}
                style={{ flexShrink: 1 }}
              >
                {t('send.to-public')}
              </Text>
              {saveContact}
            </>,
          )
        : line(
            <CheckIcon size={iconSizeSm} color={colors.fgAccent} />,
            <>
              <Text
                testID="send.address.check"
                variant="bodySmall"
                tone="muted"
                style={{ flexShrink: 1 }}
              >
                {t(kindKey(text))}
              </Text>
              {saveContact}
            </>,
          );

  const tokenView = token ? (
    <View
      testID="send.token"
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space12,
        paddingVertical: space4,
      }}
    >
      {avatarFor(contact?.label ?? '', contact?.color)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {contact?.label}
        </Text>
        <Text variant="address" tone="muted" numberOfLines={1}>
          {Utils.trimToSmall(text, 6)}
        </Text>
      </View>
    </View>
  ) : undefined;

  const results = (() => {
    const rows: React.ReactNode[] = matches.map((entry, i) => (
      <ListRow
        key={`contact.${entry.label}`}
        testID={`send.result.contact.${entry.label}`}
        divider={i > 0}
        leading={avatarFor(entry.label, entry.color)}
        title={entry.label}
        subtitle={Utils.trimToSmall(entry.address, 6)}
        onPress={() => onPickContact(entry)}
      />
    ));
    return rows;
  })();

  return (
    <View style={{ gap: space8 }}>
      <TextField
        testID="send.addressplaceholder"
        label={t('send.to')}
        value={text}
        onChangeText={onChangeText}
        placeholder={t(
          catecash ? 'send.to-placeholder-catecash' : 'send.to-placeholder',
        )}
        accessibilityLabel={t('send.address-acc')}
        autoCapitalize="none"
        autoCorrect={false}
        mono={valid === 1}
        valid={valid === 1}
        error={
          valid === -1
            ? t(catecash ? 'send.to-invalid-catecash' : 'send.to-invalid')
            : undefined
        }
        onFocus={onFocus}
        onBlur={() => {
          setEditing(false);
          onBlur();
        }}
        autoFocus={editing}
        replacement={tokenView ?? shortened}
        footer={footer}
        trailing={
          <>
            {!!text && (
              <FieldAction
                testID="send.address.clear"
                icon={XIcon}
                label={t('clear')}
                onPress={onClear}
              />
            )}
            {!text && !token && (
              <FieldAction
                testID="send.paste-button"
                icon={ClipboardPasteIcon}
                label={t('paste')}
                onPress={async () => onChangeText(await Clipboard.getString())}
                disabled={busy}
              />
            )}
            {!token && (
              <FieldAction
                testID="send.address-book"
                icon={ContactIcon}
                label={t('addressbook.pick-title')}
                onPress={onOpenBook}
                disabled={busy}
              />
            )}
            {!token && (
              <FieldAction
                ref={scanRef}
                testID="send.scan-button"
                icon={ScanIcon}
                label={t('send.scan-acc')}
                onPress={onScan}
              />
            )}
          </>
        }
      />
      {searching && !token && (
        <View testID="send.results">
          <Card flush>
            {matches.length > 0 && (
              <Text
                variant="bodySmall"
                tone="muted"
                style={{
                  fontWeight: '600',
                  paddingHorizontal: space12,
                  paddingTop: space8,
                }}
              >
                {t('send.results-contacts')}
              </Text>
            )}
            {results}
          </Card>
        </View>
      )}
    </View>
  );
}
