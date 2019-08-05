# react-hooks-compose

[![Build Status](https://travis-ci.com/helloitsjoe/react-hooks-compose.svg?branch=master)](https://travis-ci.com/helloitsjoe/react-hooks-compose)
[![Coverage Status](https://coveralls.io/repos/github/helloitsjoe/react-hooks-compose/badge.svg?branch=master)](https://coveralls.io/github/helloitsjoe/react-hooks-compose?branch=master)
[![NPM Version](https://img.shields.io/npm/v/react-hooks-compose?color=lightgray)](https://www.npmjs.com/package/react-hooks-compose)

## Installation

```
npm i react-hooks-compose
```

## Why `react-hooks-compose`?

`react-hooks-compose` gives us an ergonomic way to decoupble hooks from the
components that use them.

React Hooks bring with them many benefits. They encapsulate state logic and make
it more reusable. But what if you have pure presentational components that you
want to use with different functionality? What if you want to test your
presentaional component in isolation?

React Hooks invert the Container/Presenter pattern, putting the container
_inside_ the presenter. This makes it hard to use the same presentational
component with different hooks, and clunky to test presentational components by
themselves.

One option:

```js
import { useMyStuff } from './hooks';
import { Presenter } from './presenter';

const Wrapper = () => {
  const { foo, bar } = useMyStuff();
  return <Presenter foo={foo} bar={bar} />;
};

export default Wrapper;
```

This works fine, but you end up with an extra component just to connect the hook
to the Presenter... there must be a better way!

## Basic Usage

`composeHooks` passes values from hooks as props, and allows you to pass any
other props as normal:

```js
import composeHooks from 'react-hooks-compose';

const useForm = () => {
  const [name, setName] = useState('');
  const onChange = e => setName(e.target.value);
  return { name, onChange };
};

export const FormPresenter = ({ name, onChange, icon }) => (
  <div className="App">
    <div>{icon}</div>
    <h1>Hello, {name}!</h1>
    <input value={name} onChange={onChange} />
  </div>
);

export default composeHooks({ useForm })(FormPresenter);
```

This allows you to export both a component with contained logic, and a purely
presentational component.

### Usage with `useState`

If you compose with `useState` directly (i.e. the prop is an array), the prop
will remain an array and should be destructured before use:

```js
const FormPresenter = ({ nameState: [name, setName] }) => (
  <div className="App">
    <h1>Hello, {name}!</h1>
    <input value={name} onChange={e => setName(e.target.value)} />
  </div>
);

export default composeHooks({
  nameState: () => useState('Calvin'),
})(FormPresenter);
```

Compose multiple hooks:

```js
export default composeHooks({
  useForm,
  nameState: () => useState('Hobbes'),
})(FormPresenter);
```
