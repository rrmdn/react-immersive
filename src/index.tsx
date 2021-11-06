/// <reference path="../node_modules/requestidlecallback-polyfill/types/requestidlecallback.d.ts" />

import React, { ReactNode } from "react";
import { produce } from "immer";
import {
  createContext as createContextSelectorContext,
  useContext as useContextSelectorContext,
  useContextSelector,
} from "use-context-selector";

type Fn = (...args: any) => any;
type Actions = { [key: string]: Fn };

export function createContext<T, A extends Actions>(
  initialState: T,
  createActions: (modify: (modifier: (data: T) => void) => void) => A
) {
  const context = createContextSelectorContext({
    state: initialState,
    setState: (modifier: (state: { globalState: T }) => void) => {},
  });

  const useContext = () => {
    const ctx = useContextSelectorContext(context);
    return ctx;
  };

  function useSelectState<R>(
    select: (state: T) => R,
    dependencies: any[] = []
  ): R {
    return useContextSelector(context, ({ state }) => select(state));
  }

  const useActions = () => {
    const setState = useContextSelector(context, ({ setState }) => setState);
    const actions = React.useMemo(() => {
      const setGlobalState = (modifier: (data: T) => void) => {
        setState((draft) => {
          draft.globalState = produce(draft.globalState, modifier);
        });
      };
      return createActions(setGlobalState);
    }, [setState]);
    return actions;
  };

  const useLocalUpdates = () => {
    const { state: globalState, setState: setGlobalState } = useContext();
    const [localState, setLocalState] = React.useState({ state: globalState });
    const modifyLocalState = React.useCallback(
      (modifier: (data: T) => void) => {
        setLocalState(({ state }) => ({ state: produce(state, modifier) }));
      },
      []
    );

    React.useEffect(
      function updateLocalState() {
        setLocalState({ state: globalState });
      },
      [globalState]
    );

    React.useEffect(
      function sendUpdates() {
        const request = window.requestIdleCallback(
          () => {
            setGlobalState((draft) => {
              draft.globalState = localState.state;
            });
          },
          { timeout: 100 }
        );
        return () => window.cancelIdleCallback(request);
      },
      [localState]
    );

    const useLocalState = React.useCallback(
      function <R>(select: (state: T) => R, dependencies: any[] = []): R {
        const selector = React.useCallback(select, dependencies);
        const selected = React.useMemo(() => {
          return selector(localState.state);
        }, [localState.state, selector]);

        return selected;
      },
      [localState]
    );

    const useLocalActions = React.useCallback(() => {
      const actions = React.useMemo(() => {
        return createActions(modifyLocalState);
      }, [modifyLocalState]);
      return actions;
    }, []);

    return { useLocalState, useLocalActions };
  };

  const Provider = (props: { children: ReactNode }) => {
    const [{ globalState }, setState] = React.useState<{ globalState: T }>({
      globalState: initialState,
    });
    const setImmerState = React.useCallback(
      (modifier: (state: { globalState: T }) => void) => {
        setState((state) => produce(state, modifier));
      },
      []
    );
    return (
      <context.Provider value={{ state: globalState, setState: setImmerState }}>
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
    useLocalUpdates,
  };
}
