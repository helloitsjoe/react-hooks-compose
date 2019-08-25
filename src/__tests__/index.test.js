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

const TestComponent = () => <div>Test</div>;

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
    const wrapper = shallow(<Container />);
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Test</div>"`);
  });

  it('throws if no component', () => {
    expect(() => composeHooks()()).toThrowErrorMatchingInlineSnapshot(
      `"Component must be provided to compose"`
    );
  });

  it('if prop and hook names collide, props win', () => {
    const Container = composeHooks({ useChange })(TestComponent);
    const wrapper = shallow(<Container />);
    expect(wrapper.find(TestComponent).props().value).toBe('hi');
    wrapper.setProps({ value: 'newValue' });
    expect(wrapper.find(TestComponent).props().value).toBe('newValue');
  });

  it('warns on hook name collisions', () => {
    console.warn = jest.fn().mockImplementationOnce(() => {});
    const useChangeTwo = () => ({ value: 'duplicate-hook-prop' });
    const Container = composeHooks({ useChange, useChangeTwo })(TestComponent);
    const wrapper = shallow(<Container />);
    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
      `"prop 'value' exists, overriding with value: duplicate-hook-prop"`
    );
    expect(wrapper.find(TestComponent).props().value).toBe('duplicate-hook-prop');
    jest.restoreAllMocks();
  });
});
