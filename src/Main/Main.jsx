import Button from '@mui/material/Button';
import cn from './Main.module.css';
import { useStoreActions, useStoreState } from 'easy-peasy';

export const Main = () => {
  const selectAccount = useStoreState((state) => state.selectedAccount);
  const addRequestAndConfirm = useStoreActions((actions) => actions.addRequestAndConfirm);
  return (
    <div className={cn.container}>
      {selectAccount && (
        <Button variant="contained" onClick={addRequestAndConfirm}>
          Add Request and Confirm: Send 0.01 NEAR to eclipseer.testnet
        </Button>
      )}
    </div>
  );
};
