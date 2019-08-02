# react-hooks-compose

[![Build Status](https://travis-ci.com/helloitsjoe/react-hooks-compose.svg?branch=master)](https://travis-ci.com/helloitsjoe/react-hooks-compose)
[![Coverage Status](https://coveralls.io/repos/github/helloitsjoe/react-hooks-compose/badge.svg?branch=master)](https://coveralls.io/github/helloitsjoe/react-hooks-compose?branch=master)
[![NPM Version](https://img.shields.io/npm/v/react-hooks-compose?color=lightgray)](https://www.npmjs.com/package/react-hooks-compose)

## Installation

```
npm i react-hooks-compose
```

## Basic Usage

Composition Library for React Hooks

React Hooks inverted the Container/Presenter pattern, putting the container in the presenter, and making it clunky to test presentational components.

This library aims to help separate concerns and give you a more ergonomic way to test components that use hooks.

`composeHooks` passes values from hooks as props, and allows you to pass any other props as normal

```js
import composeHooks from 'react-hooks-compose';

const useForm = () => {
  const [name, setName] = useState('');
  const onChange = e => setName(e.target.value);
  return { name, onChange };
};

const FormPresenter = ({ name, onChange, icon }) => (
  <div className="App">
    <div>{icon}</div>
    <h1>Hello, {name}!</h1>
    <input value={name} onChange={onChange} />
  </div>
);

export default composeHooks({ useForm })(FormPresenter);
```

If you compose with `useState` directly, the prop will be the `[value, setValue]` array

```js
const FormPresenter = ({ useName: [name, setName] }) => (
  <div className="App">
    <h1>Hello, {name}!</h1>
    <input value={name} onChange={e => setName(e.target.value)} />
  </div>
);

export default composeHooks({
  useName: () => useState('Calvin'),
})(FormPresenter);
```
