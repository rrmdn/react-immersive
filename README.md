## react-immersive

Simple state management for react on top of immer

1. Define the state.
2. Define actions that will modify the state (it uses immer, so mutate it all you want).
3. Use the hooks to access the state and actions.

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
An actions creator accepts a modifier function that lets you modify the initial state directly inside each of actions that you create -- which I like to call it `draftState`.
Please head to (immer's documentation)[https://immerjs.github.io/immer/docs/introduction] if you haven't heard of it.

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
