import Button from '@mui/material/Button';
import { useStoreState, useStoreActions } from 'easy-peasy';
import { SelectAccount } from './SelectAccount/SelectAccount.jsx';
import { WalletModal } from './WalletModal/WalletModal.jsx';
import cn from './Topbar.module.css';

export const Topbar = () => {
  const selectedAccount = useStoreState((state) => state.selectedAccount);
  const openWalletModal = useStoreActions((actions) => actions.walletsConnector.modal.open);

  return (
    <div className={cn.container}>
      <p>NEAR Finance</p>
      {selectedAccount ? (
        <SelectAccount openWalletModal={openWalletModal} />
      ) : (
        <Button onClick={openWalletModal}>Connect Account</Button>
      )}
      <WalletModal />
    </div>
  );
};
