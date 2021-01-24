import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { createContext } from ".";

describe("immersive", () => {
  it("should be able to create context", () => {
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
});
