# react-hooks-compose

[![Build Status](https://travis-ci.com/helloitsjoe/react-hooks-compose.svg?branch=master)](https://travis-ci.com/helloitsjoe/react-hooks-compose)
[![Coverage Status](https://coveralls.io/repos/github/helloitsjoe/react-hooks-compose/badge.svg?branch=master)](https://coveralls.io/github/helloitsjoe/react-hooks-compose?branch=master)
[![NPM Version](https://img.shields.io/npm/v/react-hooks-compose?color=lightgray)](https://www.npmjs.com/package/react-hooks-compose)

## Installation

```
npm i react-hooks-compose
```

## Basic Usage

React Hooks bring with them many benefits, but one of the potential drawbacks is testability of presentational components.

React Hooks invert the Container/Presenter pattern, putting the container _inside_ the presenter. This makes it clunky to test presentational components.

This library aims to help separate concerns and give you a more ergonomic way to test components that use hooks.

`composeHooks` passes values from hooks as props, and allows you to pass any other props as normal:

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

If you compose with `useState` directly (i.e. the props is an array), the prop will remain an array and should be destructured before use:

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
