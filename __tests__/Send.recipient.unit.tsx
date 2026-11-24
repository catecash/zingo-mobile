/**
 * @format
 */

import 'react-native';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  ContextAppLoadedProvider,
  defaultAppContextLoaded,
} from '@app/context';
import { AddressBookFileClass, ChainNameEnum } from '@app/AppState';
import RecipientField from '@screens/Send/components/RecipientField';

const irene = new AddressBookFileClass(
  'Irene',
  'u1irene0000000000000000000000000000000000',
  '#e35f36',
  false,
  ChainNameEnum.mainChainName,
  'ZEC',
);

const field = (props: Partial<React.ComponentProps<typeof RecipientField>>) => {
  const handlers = {
    onPickContact: jest.fn(),
    onSaveContact: jest.fn(),
  };
  const view = render(
    <ContextAppLoadedProvider
      value={{
        ...defaultAppContextLoaded,
        translate: (key: string) => key,
        addressBook: [irene],
      }}
    >
      <RecipientField
        text=""
        onChangeText={jest.fn()}
        onClear={jest.fn()}
        valid={0}
        focused={false}
        onFocus={jest.fn()}
        onBlur={jest.fn()}
        contact={undefined}
        matches={[]}
        onOpenBook={jest.fn()}
        onScan={jest.fn()}
        scanRef={React.createRef()}
        busy={false}
        {...handlers}
        {...props}
      />
    </ContextAppLoadedProvider>,
  );
  return { view, handlers };
};

describe('RecipientField', () => {
  test('Tests that a typed contact name lists the matching contact', () => {
    const { view, handlers } = field({ text: 'ire', matches: [irene] });
    expect(view.getByTestId('send.results')).toHaveTextContent(/Irene/);
    fireEvent.press(view.getByTestId('send.result.contact.Irene'));
    expect(handlers.onPickContact).toHaveBeenCalledWith(irene);
  });

  test('Tests that a Catecash address shows no name lookup row', () => {
    const { view } = field({
      text: 'ypkjvw6cqqb1mydycacufhsbgponih5tnbc',
      valid: 1,
    });
    expect(view.queryByTestId('send.results')).toBeNull();
  });

  test('Tests that a contact becomes a token with its name when the address is theirs', () => {
    const { view } = field({ text: irene.address, valid: 1, contact: irene });
    expect(view.getByTestId('send.token')).toHaveTextContent(/Irene/);
    expect(view.queryByTestId('send.addressplaceholder')).toBeNull();
  });

  test('Tests that a pasted transparent address warns that the payment is public', () => {
    const { view } = field({
      text: 't1abcdefghijklmnopqrstuvwxyz1234567',
      valid: 1,
    });
    expect(view.getByText('send.to-public')).toBeTruthy();
  });

  test('Tests that text that is no address, contact or name says what is wrong', () => {
    const { view } = field({ text: '!!', valid: -1 });
    expect(view.getByTestId('send.addressplaceholder.error')).toHaveTextContent(
      'send.to-invalid',
    );
  });
});
