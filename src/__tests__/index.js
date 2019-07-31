/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
import React, { useState } from "react";
import { shallow, mount } from "enzyme";
import composeHooks from "../index";

const INITIAL_COUNT = 0;
const INITIAL_VALUE = "hi";

const useCount = () => {
  const [count, setCount] = useState(INITIAL_COUNT);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  return { count, increment, decrement };
};

const useChange = () => {
  const [value, setValue] = useState(INITIAL_VALUE);
  const onChange = e => setValue(e.target.value);
  return { value, onChange };
};

const useUseState = () => useState(INITIAL_COUNT);

const TestComponent = () => <div>Test</div>;

test("returns component if no hooks", () => {
  const Container = composeHooks()(TestComponent);
  const wrapper = shallow(<Container />);
  expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Test</div>"`);
});

test("throws if no component", () => {
  expect(() => composeHooks()()).toThrowErrorMatchingInlineSnapshot(
    `"Component must be provided to composeHooks"`
  );
});

test("passes custom hooks to component", () => {
  const Container = composeHooks({ useCount, useChange })(TestComponent);
  const wrapper = shallow(<Container />);
  const { count, increment, decrement, value, onChange } = wrapper
    .find(TestComponent)
    .props();
  expect(count).toBe(INITIAL_COUNT);
  expect(value).toBe(INITIAL_VALUE);
  expect(typeof increment).toBe("function");
  expect(typeof decrement).toBe("function");
  expect(typeof onChange).toBe("function");
});

test("passes props to component", () => {
  const Container = composeHooks({ useChange })(TestComponent);
  const wrapper = shallow(<Container foo="bar" />);
  const { foo } = wrapper.find(TestComponent).props();
  expect(foo).toBe("bar");
});

test("if prop and hook names collide, props win", () => {
  const Container = composeHooks({ useChange })(TestComponent);
  const wrapper = shallow(<Container />);
  expect(wrapper.find(TestComponent).props().value).toBe("hi");
  wrapper.setProps({ value: "newValue" });
  expect(wrapper.find(TestComponent).props().value).toBe("newValue");
});

test("warns on hook name collisions", () => {
  console.warn = jest.fn().mockImplementationOnce(() => {});
  const useChangeTwo = () => ({ value: "duplicate-hook-prop" });
  const Container = composeHooks({ useChange, useChangeTwo })(TestComponent);
  const wrapper = shallow(<Container />);
  expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
    `"prop 'value' exists, overriding with value: duplicate-hook-prop"`
  );
  expect(wrapper.find(TestComponent).props().value).toBe("duplicate-hook-prop");
  jest.restoreAllMocks();
});

test("hooks work as expected", () => {
  const Component = ({ value, onChange }) => (
    <input value={value} onChange={onChange} />
  );
  const Container = composeHooks({ useChange })(Component);
  const wrapper = mount(<Container />);
  expect(wrapper.find("input").props().value).toBe(INITIAL_VALUE);
  wrapper.find("input").simulate("change", { target: { value: "new" } });
  expect(wrapper.find("input").props().value).toBe("new");
});

test("works with custom hook that returns array", () => {
  const Component = ({ simpleHook }) => {
    const [count, setCount] = simpleHook();
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  };

  const Container = composeHooks({ simpleHook: useUseState })(Component);
  const wrapper = mount(<Container />);
  expect(wrapper.text()).toBe(INITIAL_COUNT.toString());
  wrapper.find("button").simulate("click");
  expect(wrapper.text()).toBe((INITIAL_COUNT + 1).toString());
});
