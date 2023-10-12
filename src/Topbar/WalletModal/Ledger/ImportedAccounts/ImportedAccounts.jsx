import { Button } from '@mui/material';

export const ImportedAccounts = ({ routeParams, closeModal }) => {
  return (
    <div>
      <h2>Multisig Accounts</h2>
      <h3>We found followed accounts</h3>
      {routeParams?.accounts.map(({ accountId }) => (
        <p key={accountId}>{accountId}</p>
      ))}
      <Button variant="outlined" onClick={closeModal}>
        Close
      </Button>
    </div>
  );
};
