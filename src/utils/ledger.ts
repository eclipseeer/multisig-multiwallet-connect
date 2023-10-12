//-@ts-nocheck
import { signTransactions } from '@near-finance-near-wallet-selector/wallet-utils';
import { getActiveAccount } from '@near-finance-near-wallet-selector/core';
import { isLedgerSupported, LedgerClient } from '../store/wallets/ledger/helpers/LedgerClient';
import * as nearAPI from 'near-api-js';

// import type {
//   WalletModuleFactory,
//   WalletBehaviourFactory,
//   JsonStorageService,
//   Account,
//   HardwareWallet,
//   Transaction,
//   Optional,
// } from '@near-finance-near-wallet-selector/core';
import type { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import type { Subscription } from '../store/wallets/ledger/helpers/LedgerClient';
import type { Signer } from 'near-api-js';

// interface LedgerAccount extends Account {
//   derivationPath: string;
//   publicKey: string;
// }

interface ValidateAccessKeyParams {
  accountId: string;
  publicKey: string;
}

interface LedgerState {
  client: LedgerClient;
  accounts: any;
  subscriptions: Array<Subscription>;
}

export interface LedgerParams {
  iconUrl?: string;
  deprecated?: boolean;
}

export const STORAGE_ACCOUNTS = 'accounts';



const setupLedgerState:any = async (storage: any) => {
  const accounts:any = await storage.getItem(STORAGE_ACCOUNTS);
  return {
    client: new LedgerClient(),
    subscriptions: [],
    accounts: accounts || [],
  };
};

const Ledger: any = async ({ options, store, provider, logger, storage, metadata }) => {
  const _state = await setupLedgerState(storage);

  const signer: Signer = {
    createKey: () => {
      throw new Error('Not implemented');
    },

    getPublicKey: async (accountId) => {
      const account = _state.accounts.find((a: any) => a.accountId === accountId);
      if (!account) throw new Error('Failed to find public key for account');
      return nearAPI.utils.PublicKey.from(account.publicKey);
    },

    signMessage: async (message, accountId) => {
      const account = _state.accounts.find((a:any) => a.accountId === accountId);
      logger.log('signMessage', { message, accountId, account });
      if (!account) {
        throw new Error('Failed to find account for signing');
      }

      const signature = await _state.client.sign({
        data: message,
        derivationPath: account.derivationPath,
      });

      return {
        signature,
        publicKey: nearAPI.utils.PublicKey.from(account.publicKey),
      };
    },
  };

  const getAccounts = (): Array<any> => {
    return _state.accounts.map((x) => ({
      // @ts-ignore
      accountId: x.accountId,
      publicKey: 'ed25519:' + x.publicKey,
      derivationPath: x.derivationPath,
    }));
  };

  const cleanup = () => {
    _state.subscriptions.forEach((subscription) => subscription.remove());

    _state.subscriptions = [];
    _state.accounts = [];

    storage.removeItem(STORAGE_ACCOUNTS);
  };

  // @ts-ignore
  const signOut: any = async () => {
    if (_state.client.isConnected()) {
      await _state.client.disconnect().catch((err) => {
        logger.log('Failed to disconnect device');
        logger.error(err);
      });
    }

    cleanup();
  };

  // @ts-ignore
  const connectLedgerDevice = async () => {
    if (_state.client.isConnected()) {
      return;
    }

    await _state.client.connect();
  };

  const validateAccessKey = ({ accountId, publicKey }: ValidateAccessKeyParams) => {
    logger.log('validateAccessKey', { accountId, publicKey });

    return provider.viewAccessKey({ accountId, publicKey }).then(
      (accessKey:any) => {
        logger.log('validateAccessKey:accessKey', { accessKey });

        return accessKey;
      },
      (err:any) => {
        if (err.type === 'AccessKeyDoesNotExist') {
          return null;
        }

        throw err;
      },
    );
  };

  const transformTransactions = (transactions: any): any => {
    const { contract } = store.getState();

    if (!contract) {
      throw new Error('Wallet not signed in');
    }

    const account = getActiveAccount(store.getState());
    if (!account) {
      throw new Error('No active account');
    }

    return transactions.map((transaction:any) => {
      const t:any = {
        signerId: transaction.signerId || account.accountId,
        receiverId: transaction.receiverId || contract.contractId,
        actions: transaction.actions,
      };
      return t;
    });
  };

  return {
    async signIn({ accounts }) {
      logger.log('Ledger:signIn', { accounts });
      const existingAccounts = getAccounts();

      if (existingAccounts.length) {
        return existingAccounts;
      }

      const ledgerAccounts: any = [];

      for (let i = 0; i < accounts.length; i++) {
        const { derivationPath, accountId, publicKey } = accounts[i];

        const accessKey = await validateAccessKey({ accountId, publicKey });

        if (!accessKey) {
          throw new Error(`Public key is not registered with the account '${accountId}'.`);
        }

        ledgerAccounts.push({
          accountId,
          derivationPath,
          publicKey,
        });
      }

      await storage.setItem(STORAGE_ACCOUNTS, ledgerAccounts);
      _state.accounts = ledgerAccounts;

      return getAccounts();
    },

    signOut,

    async getAccounts() {
      return getAccounts();
    },
    // @ts-ignore
    async verifyOwner({ message }) {
      logger.log('Ledger:verifyOwner', { message });
      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signAndSendTransaction({ signerId, receiverId, actions }) {
      // const pk = signer.getPublicKey();
      logger.log('HERE: signAndSendTransaction', {
        signerId,
        receiverId,
        actions,
        signer,
        // pk,
      });

      if (!_state.accounts.length) {
        throw new Error('Wallet not signed in');
      }

      // Note: Connection must be triggered by user interaction.
      await connectLedgerDevice();

      logger.log('Going to sign transaction');
      const signedTransactions = await signTransactions(
        transformTransactions([{ signerId, receiverId, actions }]),
        signer,
        options.network,
      );
      logger.log('Signed transactions', { signedTransactions });

      return provider.sendTransaction(signedTransactions[0]);
    },

    async signAndSendTransactions({ transactions }) {
      logger.log('signAndSendTransactions', { transactions });

      if (!_state.accounts.length) {
        throw new Error('Wallet not signed in');
      }

      // Note: Connection must be triggered by user interaction.
      await connectLedgerDevice();

      const signedTransactions = await signTransactions(
        transformTransactions(transactions),
        signer,
        options.network,
      );

      const results: Array<FinalExecutionOutcome> = [];

      for (let i = 0; i < signedTransactions.length; i++) {
        results.push(await provider.sendTransaction(signedTransactions[i]));
      }

      return results;
    },

    async getPublicKey(derivationPath: string) {
      await connectLedgerDevice();
      return await _state.client.getPublicKey({ derivationPath });
    },
  };
};

export function setupLedger({ deprecated = false }: any): any {
  return async () => {
    const mobile = false;
    const supported = isLedgerSupported();

    if (mobile) {
      return null;
    }

    return {
      id: 'ledger',
      type: 'hardware',
      metadata: {
        name: 'Ledger',
        description: 'Protect crypto assets with the most popular hardware wallet.',
        deprecated,
        available: supported,
      },
      init: Ledger,
    };
  };
}
