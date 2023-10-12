import { Topbar } from './Topbar/Topbar.jsx';
import { Main } from './Main/Main.jsx';
import cn from './App.module.css';
import { useEffect } from 'react';
import { useStoreActions, useStoreRehydrated } from 'easy-peasy';

export const App = () => {
  const isRehydrated = useStoreRehydrated();
  const initApp = useStoreActions((actions) => actions.initApp);

  useEffect(() => {
    initApp();
  }, []);

  if (!isRehydrated) return null;

  return (
    <div className={cn.container}>
      <Topbar />
      <Main />
    </div>
  );
};
