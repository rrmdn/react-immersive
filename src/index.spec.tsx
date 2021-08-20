import "requestidlecallback-polyfill";
import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { createContext } from ".";

describe("immersive", () => {
  it("should be able to create context", async () => {
    const context = createContext(
      { tasks: [{ task: "hello", done: false }] },
      (modify) => ({
        addTask: (task: string) => {
          modify((draft) => {
            draft.tasks.push({ done: false, task });
          });
        },
        removeTask: (index: number) => {
          modify((draft) => {
            draft.tasks.splice(index, 1);
          });
        },
      })
    );

    const { result: ctx } = renderHook(
      () => ({
        actions: context.useActions(),
        tasks: context.useSelectState((data) => data.tasks),
      }),
      {
        wrapper: ({ children }) => (
          <context.Provider>{children}</context.Provider>
        ),
      }
    );

    expect(ctx.current.tasks.length).toBe(1);

    act(() => {
      ctx.current.actions.addTask("New task");
    });

    expect(ctx.current.tasks.length).toBe(2);

    act(() => {
      ctx.current.actions.removeTask(0);
    });

    expect(ctx.current.tasks.length).toBe(1);
  });

  it("should be able to run useLocalUpdates", async () => {
    const context = createContext(
      { tasks: [{ task: "hello", done: false }] },
      (modify) => ({
        addTask: (task: string) => {
          modify((draft) => {
            draft.tasks.push({ done: false, task });
          });
        },
        removeTask: (index: number) => {
          modify((draft) => {
            draft.tasks.splice(index, 1);
          });
        },
      })
    );

    const { result: ctx, waitForNextUpdate } = renderHook(
      () => {
        ({});
        const localUpdates = context.useLocalUpdates();
        return {
          localState: localUpdates.useLocalState((data) => data),
          localActions: localUpdates.useLocalActions(),
          globalActions: context.useActions(),
          globalState: context.useSelectState((data) => data),
        };
      },
      {
        wrapper: ({ children }) => (
          <context.Provider>{children}</context.Provider>
        ),
      }
    );

    // commit local updates
    act(() => {
      ctx.current.localActions.addTask("New task");
    });

    // check the difference between local & global state
    expect(ctx.current.localState.tasks.length).toEqual(2);
    expect(ctx.current.globalState.tasks.length).toEqual(1);
    expect(ctx.current.globalState).not.toEqual(ctx.current.localState);

    // wait for local updates to be broadcasted
    await waitForNextUpdate();
    expect(ctx.current.globalState.tasks.length).toEqual(2);
    expect(ctx.current.globalState).toEqual(ctx.current.localState);
  });

  it("should be able to clone a context with a different initial state", () => {
    const context = createContext(
      { tasks: [{ task: "hello", done: false }] },
      (modify) => ({
        addTask: (task: string) => {
          modify((draft) => {
            draft.tasks.push({ done: false, task });
          });
        },
      })
    );

    const clonedContext = context.clone({
      tasks: [{ task: "world", done: true }],
    });

    const { result: ctx } = renderHook(
      () => ({
        actions: clonedContext.useActions(),
        tasks: clonedContext.useSelectState((data) => data.tasks),
      }),
      {
        wrapper: ({ children }) => (
          <context.Provider>{children}</context.Provider>
        ),
      }
    );
    expect(ctx.current.tasks[0].task).toBe("world");
    expect(typeof ctx.current.actions.addTask).toBe("function");
  });
});
