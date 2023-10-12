import { Wallets } from './Wallets/Wallets.jsx';
import { Connect } from './Ledger/Connect/Connect.jsx';
import { SpecifyPath } from './Ledger/SpecifyPath/SpecifyPath.jsx';
import { ConnectionProgress } from './Ledger/ConnectionProgress/ConnectionProgress.jsx';
import { ConnectError } from './Ledger/ConnectError/ConnectError.jsx';
import { FindMultisigAccountsProgress } from './Ledger/FindMultisigAccountsProgress/FindMultisigAccountsProgress.jsx';
import { FindMultisigAccountsError } from './Ledger/FindMultisigAccountsError/FindMultisigAccountsError.jsx';
import { ImportedAccounts } from './Ledger/ImportedAccounts/ImportedAccounts.jsx';
import cn from './WalletModal.module.css';
import { useStoreState, useStoreActions } from 'easy-peasy';
import { useEffect } from 'react';

export const WalletModal = () => {
  const isOpen = useStoreState((state) => state.walletsConnector.modal.isOpen);
  const route = useStoreState((state) => state.walletsConnector.modal.route);
  const routeParams = useStoreState((state) => state.walletsConnector.modal.routeParams);
  const close = useStoreActions((actions) => actions.walletsConnector.modal.close);
  const navigate = useStoreActions((state) => state.walletsConnector.modal.navigate);

  useEffect(() => {
    if (route !== '/wallets') navigate('/wallets');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={cn.container} onClick={close}>
      <div className={cn.modal} onClick={(e) => e.stopPropagation()}>
        {route === '/wallets' && <Wallets />}
        {route === '/ledger/connect' && <Connect />}
        {route === '/ledger/connect/specify-path' && <SpecifyPath />}
        {route === '/ledger/connect/progress' && <ConnectionProgress />}
        {route === '/ledger/connect/error' && <ConnectError routeParams={routeParams} />}
        {route === '/ledger/multisig-accounts/progress' && <FindMultisigAccountsProgress />}
        {route === '/ledger/multisig-accounts/success' && (
          <ImportedAccounts routeParams={routeParams} closeModal={close} />
        )}
        {route === '/ledger/multisig-accounts/error' && (
          <FindMultisigAccountsError routeParams={routeParams} />
        )}
      </div>
    </div>
  );
};
