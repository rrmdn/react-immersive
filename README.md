## react-immersive

Simple state management for react on top of immer

1. Define the state.
2. Define actions that will modify the state (it uses immer, so mutate it all you want).
3. Use the hooks to access the state and actions.
4. Use local updates to prioritize user input response.

## Installation

Install via yarn:

```sh
yarn add immer react-immersive
```

Or npm:

```sh
npm install --save immer react-immersive
```

## Usage

Pass your initial state as the first argument, followed by an actions creator on the second argument.
An actions creator accepts a modifier function that lets you modify the state (I prefer to call it `draftState`) directly inside each of actions that you create.

Please head to [immer's documentation](https://immerjs.github.io/immer/docs/introduction) if you haven't heard of it.

### Initialization

> todo.js

```js
import { createContext } from "react-immersive";

const todo = createContext(
  { tasks: [{ task: "hello", done: false }] },
  (modify) => ({
    addTask: (task) => {
      modify((draft) => {
        draft.tasks.push({ done: false, task });
      });
    },
    removeTask: (index) => {
      modify((draft) => {
        draft.tasks.splice(index, 1);
      });
    },
  })
);

export default todo;
```

> main.jsx

```jsx
ReactDOM.render(
  <todo.Provider>
    <YourApp />
  </todo.Provider>
);
```

### Accessing actions

```jsx
import todo from "./todo";

const SomeComponent = () => {
  const actions = todo.useActions();
  const handleAddNewTask = () => {
    actions.addTask("Test");
  };

  const handleRemoveTask = () => {
    actions.removeTask(0);
  };

  return <div></div>;
};
```

### Accessing state

`useSelectState` accepts a function that selects the state target, allowing your component to focus only on what matters.

```jsx
import todo from "./todo";

const OtherComponent = () => {
  const firstTask = todo.useSelectState((state) => state.tasks[0]);
  return <div></div>;
};
```

### Using local updates

This is an experimental feature that lets you prioritize the rendering of the closest component to the user input in order to improve the user-perceived performance of your large application. This feature relies on the presence of [window.requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback), therefore you need to add the [polyfill](https://github.com/pladaria/requestidlecallback-polyfill) at the beginning of your application entrypoint.

```jsx
import todo from "./todo";

const SomeComponent = () => {
  const localUpdates = todo.useLocalUpdates;
  const actions = localUpdates.useActions();
  const handleAddNewTask = () => {
    actions.addTask("Test");
  };

  const handleRemoveTask = () => {
    actions.removeTask(0);
  };

  const firstTask = localUpdates.useSelectState((state) => state.tasks[0]);

  return <div></div>;
};
```

In this example, `SomeComponent` will maintain a copy of the global state in `localUpdates`. Each changes that happen to `localUpdates` will be emitted to the global state after the `SomeComponent` completes re-rendering.
