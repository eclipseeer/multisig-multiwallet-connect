import { Button } from '@mui/material';
import { useStoreActions } from 'easy-peasy';

export const ConnectError = ({ routeParams }) => {
  const { name, message } = routeParams?.error;
  const connect = useStoreActions((state) => state.wallets.ledger.connect);

  return (
    <div>
      <h3>{name}</h3>
      <p>{message}</p>
      <Button variant="outlined" onClick={connect}>
        Retry
      </Button>
    </div>
  );
};
