import 'react-native';
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';

import { ChainNameEnum } from '@app/AppState';
import {
  ContextAppLoadedProvider,
  defaultAppContextLoaded,
} from '@app/context';
import NewAddressTag from '@ui/widgets/NewAddressTag';
import { mockTranslate } from '../__mocks__/dataMocks/mockTranslate';

test('Tests that the own address tag shows Catecash when the wallet uses Catecash mainnet.', () => {
  render(
    <ContextAppLoadedProvider
      value={{
        ...defaultAppContextLoaded,
        walletChainName: ChainNameEnum.catecashMainnetChainName,
        translate: mockTranslate,
      }}
    >
      <NewAddressTag
        address="cate1abc"
        closeSheet={jest.fn()}
        setAddressBook={jest.fn()}
      />
    </ContextAppLoadedProvider>,
  );

  expect(
    within(screen.getByTestId('chainselect.field')).getByText('Catecash'),
  ).toBeOnTheScreen();
  expect(screen.getByTestId('chainselect.ticker')).toHaveTextContent('CATE');
});
