import { action } from 'easy-peasy';

export const walletsConnector = {
  modal: {
    isOpen: false,
    route: '/wallets',
    routeParams: null,

    open: action((state) => {
      state.isOpen = true;
    }),
    close: action((state) => {
      state.isOpen = false;
    }),
    navigate: action((state, payload) => {
      if (typeof payload === 'string') {
        state.route = payload;
        state.routeParams = null;
        return;
      }
      state.route = payload.route;
      state.routeParams = payload.routeParams;
    }),
  },
};
