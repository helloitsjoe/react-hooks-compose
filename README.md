# react-hooks-compose

[![Build Status](https://travis-ci.com/helloitsjoe/react-hooks-compose.svg?branch=master)](https://travis-ci.com/helloitsjoe/react-hooks-compose)
[![Coverage Status](https://coveralls.io/repos/github/helloitsjoe/react-hooks-compose/badge.svg?branch=master)](https://coveralls.io/github/helloitsjoe/react-hooks-compose?branch=master)
[![NPM Version](https://img.shields.io/npm/v/react-hooks-compose?color=lightgray)](https://www.npmjs.com/package/react-hooks-compose)

## Installation

```
npm i react-hooks-compose
```

## Why `react-hooks-compose`?

`react-hooks-compose` provides an ergonomic way to decouple hooks from the components that use them.

React Hooks are great. They encapsulate state logic and make it more reusable. But what if you have
pure presentational components that you want to use with different state? What if you want to test
your presentaional component in isolation? What happened to the single responsibility principle?

React Hooks invert the Container/Presenter pattern, putting the container _inside_ the presenter.
This makes it hard to use the same presentational component with different hooks, and clunky to test
presentational components by themselves. It gives stateful components more than
[one reason to change](https://www.wikiwand.com/en/Single_responsibility_principle).

One option:

```jsx
import { Presenter } from './presenter';
import { useCustomHook } from './hooks';

const Wrapper = () => {
  const { foo, bar } = useCustomHook();
  return <Presenter foo={foo} bar={bar} />;
};

export default Wrapper;
```

This works fine, but you end up with an extra component just to connect the hook to the Presenter.
If you want to test the presenter in isolation, you have to export it separately. there must be a
better way!

## Basic Usage

`composeHooks` passes values from hooks as props, and allows you to pass any other props as normal.
This allows you to export the hook, stateful component, and purely presentational component
separately.

```jsx
import composeHooks from 'react-hooks-compose';

const useForm = () => {
  const [name, setName] = useState('');
  const onChange = e => setName(e.target.value);
  return { name, onChange };
};

// Other props (in this case `icon`) can be passed in separately
const FormPresenter = ({ name, onChange, icon }) => (
  <div className="App">
    <div>{icon}</div>
    <h1>Hello, {name}!</h1>
    <input value={name} onChange={onChange} />
  </div>
);

export default composeHooks({ useForm })(FormPresenter);
```

You can think of `composeHooks` like `react-redux`'s `connect` HOC. For one thing, it creates an
implicit container. You can think of the object passed into `composeHooks` as `mapHooksToProps`,
similar to
[the object form of `mapDispatchToProps`](https://daveceddia.com/redux-mapdispatchtoprops-object-form/).

### Compose multiple hooks:

```js
const Presenter = ({ name, onChange, foo, bar, value }) => (
  <div className="App">
    <h1>Hello, {name}!</h1>
    <p>Context value is {value}</p>
    <p>
      foo is {foo}, bar is {bar}
    </p>
    <input value={name} onChange={onChange} />
  </div>
);

export default composeHooks({
  useForm,
  useFooBar,
  value: () => useContext(MyContext), // Usage with `useContext`
})(FormPresenter);
```

### Usage with `useState`

If you compose with `useState` directly (i.e. the prop is an array), the prop will remain an array
and should be destructured before use:

```jsx
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

### Pass in props for initial values

If your hooks need access to props to set their initial values, you can pass a function to
`composeHooks`. This function receives `props` as an argument, and should always return an object:

```jsx
const useForm = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  const onChange = e => setValue(e.target.value);
  return { value, onChange };
}

const FormContainer = composeHooks(props => ({
  useForm: () => useForm(props.initialValue)
})(FormPresenter);

<FormContainer initialValue="Susie" />
```

## Testing

`composeHooks` is great for testing. Any props you pass in will override the hooks values, so you
can test the presenter and container with a single export:

```jsx
// band-member.js
const BandMember = ({singer, onClick}) => {...} // <-- Presenter

export default composeHooks({ useName })(BandMember);

// band-member.test.js
it('returns Joey if singer is true', () => {
  // Pass in a `singer` boolean as with any presentational component.
  // Containers don't usually allow this.
  const {getByLabelText} = render(<BandMember singer />);
  expect(getByLabelText('Name').textContent).toBe('Joey');
});

it('updates name to Joey when Get Singer button is clicked', () => {
  // If you don't pass in props, the component will use the hooks provided
  // in the module. In this case, `useName` returns `singer` and `onClick`.
  const {getByLabelText} = render(<BandMember />);
  expect(getByLabelText('Name').textContent).toBe('Johnny');
  fireEvent.click(getByText('Get Singer'));
  expect(getByLabelText('Name').textContent).toBe('Joey');
})
```
