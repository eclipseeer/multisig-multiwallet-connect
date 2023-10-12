import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { useEffect, useState } from 'react';
import {
  connect,
  Near,
  Connection,
  multisig,
  keyStores,
  WalletConnection,
  utils,
  transactions,
} from 'near-api-js';
import { tx } from './tx.js';
import { addRequestAndConfirm } from './addRequestAndConfirm.js';
import '@near-wallet-selector/modal-ui/styles.css';

const selector = await setupWalletSelector({
  network: 'testnet',
  modules: [setupMyNearWallet(), setupMeteorWallet()],
});

const modal = setupModal(selector, {});

const myKeyStore = new keyStores.BrowserLocalStorageKeyStore();

const connectionConfig = {
  networkId: 'testnet',
  keyStore: myKeyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com',
};

export const Account = () => {
  // const [state, setState] = useState({});
  const state = {};

  useEffect(() => {
    const init = async () => {
      // const selector = await setupWalletSelector({
      //   network: "testnet",
      //   modules: [setupMyNearWallet()],
      // });
      // const wallet = await selector.wallet("my-near-wallet");

      const nearConnection = await connect(connectionConfig);
      const walletConnection = new WalletConnection(nearConnection, 'some-app');

      state.nearConnection = nearConnection;
      state.walletConnection = walletConnection;
      // state.selector = selector;
      // state.wallet = wallet;
      // console.log(nearConnection);
      // console.log(walletConnection);
    };
    init();
  }, []);

  const onClick = async () => {
    try {
      const transaction = await tx(state.nearConnection.connection.provider);

      const a = await state.walletConnection.requestSignTransactions({
        transactions: [transaction],
        meta: 'some data',
        callbackUrl: window.location.href,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const getAccountKeys = async () => {
    const account = await state.nearConnection.account('eclpseeer-multisig-test-1.testnet');
    const res = await account.getAccessKeys();
    console.log(res);
  };

  const _addRequestAndConfirm = async () => {
    try {
      const transaction = await addRequestAndConfirm(state.nearConnection.connection.provider);

      const a = await state.walletConnection.requestSignTransactions({
        transactions: [transaction],
        meta: 'some data 1',
        callbackUrl: window.location.href,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const signIn = async () => {
    await state.walletConnection.requestSignIn({});
  };

  return (
    <div>
      <button onClick={onClick}>Send Tokens</button>
      <button onClick={getAccountKeys}>Get Account Keys</button>
      <button onClick={_addRequestAndConfirm}>Add Request And Confirm</button>
      <button onClick={signIn}>Sign in</button>
      <button
        onClick={() => {
          modal.show();
        }}
      >
        Open modal
      </button>
    </div>
  );
};
