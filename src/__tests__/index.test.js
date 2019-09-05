/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
import React, { useState } from 'react';
import { shallow, mount } from 'enzyme';
import composeHooks from '../index';

const INITIAL_COUNT = 0;
const INITIAL_VALUE = 'hi';

const useCount = () => {
  const [count, setCount] = useState(INITIAL_COUNT);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  return { count, increment, decrement };
};

const useChange = (initialValue = INITIAL_VALUE) => {
  const [value, setValue] = useState(initialValue);
  const onChange = e => setValue(e.target.value);
  return { value, onChange };
};

const useUseState = () => useState(INITIAL_COUNT);

const TestComponent = ({ text = 'Test' }) => <div>{text}</div>;

test('passes custom hooks to component', () => {
  const Container = composeHooks({ useCount, useChange })(TestComponent);
  const wrapper = shallow(<Container />);
  const { count, increment, decrement, value, onChange } = wrapper.find(TestComponent).props();
  expect(count).toBe(INITIAL_COUNT);
  expect(value).toBe(INITIAL_VALUE);
  expect(typeof increment).toBe('function');
  expect(typeof decrement).toBe('function');
  expect(typeof onChange).toBe('function');
});

test('passes props to component', () => {
  const Container = composeHooks({ useChange })(TestComponent);
  const wrapper = shallow(<Container foo="bar" />);
  const { foo } = wrapper.find(TestComponent).props();
  expect(foo).toBe('bar');
});

test('hooks work as expected', () => {
  const Component = ({ value, onChange }) => <input value={value} onChange={onChange} />;
  const Container = composeHooks({ useChange })(Component);
  const wrapper = mount(<Container />);
  expect(wrapper.find('input').props().value).toBe(INITIAL_VALUE);
  wrapper.find('input').simulate('change', { target: { value: 'new' } });
  expect(wrapper.find('input').props().value).toBe('new');
});

test('works with custom hook that returns array', () => {
  const Component = ({ simpleHook }) => {
    const [count, setCount] = simpleHook;
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  };

  const Container = composeHooks({ simpleHook: useUseState })(Component);
  const wrapper = mount(<Container />);
  expect(wrapper.text()).toBe(INITIAL_COUNT.toString());
  wrapper.find('button').simulate('click');
  expect(wrapper.text()).toBe((INITIAL_COUNT + 1).toString());
});

test('works with custom hook that returns single value', () => {
  // Check single function value
  let outerFoo;
  const useFoo = () => {
    const [foo, setFoo] = useState('before');
    outerFoo = foo;
    return setFoo;
  };
  // Check single value
  const useBar = () => {
    const [bar] = useState('Click me');
    return bar;
  };
  const Component = ({ setFoo, bar }) => <button onClick={() => setFoo('after')}>{bar}</button>;
  const Container = composeHooks({ setFoo: useFoo, bar: useBar })(Component);
  const wrapper = mount(<Container />);
  expect(outerFoo).toBe('before');
  wrapper.find({ children: 'Click me' }).simulate('click');
  expect(outerFoo).toBe('after');
});

test('can pass props to hooks via function', () => {
  const TEST_VALUE = 'test-value';
  const Component = ({ value }) => value;
  const Container = composeHooks(props => ({
    useChange: () => useChange(props.initialValue),
  }))(Component);
  const wrapper = mount(<Container initialValue={TEST_VALUE} />);
  expect(wrapper.text()).toBe(TEST_VALUE);
});

describe('Edge cases', () => {
  it('returns component if no hooks', () => {
    const Container = composeHooks()(TestComponent);
    const wrapper = shallow(<Container text="some text" />);
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>some text</div>"`);
  });

  it('throws if no component', () => {
    expect(() => composeHooks()()).toThrowErrorMatchingInlineSnapshot(
      `"Component must be provided to compose"`
    );
  });
});

describe('Naming collisions', () => {
  const useOne = () => ({ text: 'one' });
  const useTwo = () => ({ text: 'two' });
  const useNumber = () => ({ number: 1 });
  const useBool = () => ({ bool: true });
  const useNull = () => ({ null: 'not-null' });

  it('if prop and hook names collide, props win', () => {
    jest.spyOn(console, 'warn');
    const Container = composeHooks({ useOne, useNumber, useBool, useNull })(TestComponent);
    // Check falsy values, should warn for everything but undefined
    const wrapper = mount(<Container text="" number={0} bool={false} null={null} />);
    const [first, second, third, fourth] = console.warn.mock.calls;
    expect(first[0]).toMatchInlineSnapshot(`"prop 'text' exists, overriding with value: ''"`);
    expect(second[0]).toMatchInlineSnapshot(`"prop 'number' exists, overriding with value: '0'"`);
    expect(third[0]).toMatchInlineSnapshot(`"prop 'bool' exists, overriding with value: 'false'"`);
    expect(fourth[0]).toMatchInlineSnapshot(`"prop 'null' exists, overriding with value: 'null'"`);
    expect(wrapper.find(TestComponent).props().text).toBe('');
    expect(wrapper.find(TestComponent).props().number).toBe(0);
    expect(wrapper.find(TestComponent).props().bool).toBe(false);
    expect(wrapper.find(TestComponent).props().null).toBe(null);
    jest.restoreAllMocks();
  });

  it('if multiple hook value names collide, last one wins', () => {
    jest.spyOn(console, 'warn');
    const Container = composeHooks({ useOne, useTwo })(TestComponent);
    const wrapper = mount(<Container />);
    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
      `"prop 'text' exists, overriding with value: 'two'"`
    );
    expect(wrapper.find(TestComponent).text()).toBe('two');
    jest.restoreAllMocks();
  });
});
