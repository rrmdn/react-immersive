import React, { ReactNode } from "react";
import { produce } from "immer";

type Fn = (...args: any) => any;
type Actions = { [key: string]: Fn };

type Config = { selectDelay: number };

const defaultConfig: Config = { selectDelay: 0 };

export function createContext<T, A extends Actions>(
  initialState: T,
  createActions: (modify: (modifier: (data: T) => void) => void) => A,
  config: Config = defaultConfig
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
    { selectDelay }: Config = config
  ): R {
    const { state } = useContext();
    const [selected, setSelected] = React.useState(select(state));
    React.useEffect(() => {
      const timeout = setTimeout(() => {
        setSelected(select(state));
      }, selectDelay);
      return () => clearTimeout(timeout);
    }, [state]);
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
