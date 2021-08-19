import "requestidlecallback-polyfill";
import React, { ReactNode } from "react";
import { produce } from "immer";

type Fn = (...args: any) => any;
type Actions = { [key: string]: Fn };

export function createContext<T, A extends Actions>(
  initialState: T,
  createActions: (modify: (modifier: (data: T) => void) => void) => A
) {
  const context = React.createContext({
    state: initialState,
    setState: (modifier: (data: T) => void) => {},
  });

  const useContext = () => {
    const ctx = React.useContext(context);
    return ctx;
  };

  function useSelectState<R>(
    select: (state: T) => R,
    dependencies: any[] = []
  ): R {
    const { state } = useContext();
    const selector = React.useCallback(select, dependencies);
    const [selected, setSelected] = React.useState(selector(state));
    React.useEffect(() => {
      const request = window.requestIdleCallback(() => {
        setSelected(selector(state));
      });
      return () => window.cancelIdleCallback(request);
    }, [state, selector]);
    return selected;
  }

  const useActions = () => {
    const { setState } = useContext();
    const actions = React.useMemo(() => {
      return createActions(setState);
    }, [setState]);
    return actions;
  };

  const Provider = (props: { children: ReactNode }) => {
    const [state, setState] = React.useState(initialState);
    const setImmerState = React.useCallback((modifier: (data: T) => void) => {
      setState((state) => produce(state, modifier));
    }, []);
    return (
      <context.Provider value={{ state, setState: setImmerState }}>
        {props.children}
      </context.Provider>
    );
  };

  const clone = (newInitialState: T) =>
    createContext(newInitialState, createActions);

  return {
    useContext,
    useSelectState,
    useActions,
    Provider,
    clone,
  };
}
