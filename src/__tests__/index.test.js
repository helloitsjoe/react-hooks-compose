/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
import React, { useState, useContext, useEffect } from 'react';
// TODO: Convert to RTL
import { shallow, mount } from 'enzyme';
import { render, fireEvent, waitFor } from '@testing-library/react';
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

const TestComponent = ({ text }) => <div>{text}</div>;

TestComponent.defaultProps = {
  text: 'Test',
};

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

test('works with useContext', () => {
  const TestContext = React.createContext();
  const Component = ({ value }) => <div>{value}</div>;
  const Container = composeHooks({ value: () => useContext(TestContext) })(Component);
  const wrapper = mount(
    <TestContext.Provider value="Hello">
      <Container />
    </TestContext.Provider>
  );
  expect(wrapper.text()).toBe('Hello');
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

test('useEffect from custom hook', () => {
  const Component = ({ value }) => value;
  const customHook = () => {
    const [value, setValue] = useState('before');
    useEffect(() => {
      setTimeout(() => {
        setValue('after');
      }, 50);
    }, []);
    return { value };
  };
  const Container = composeHooks({ customHook })(Component);
  const { container } = render(<Container />);
  expect(container.textContent).toBe('before');
  return waitFor(() => {
    expect(container.textContent).toBe('after');
  });
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

describe('React.memo', () => {
  // Note that using shorthand like composeHooks({ useOne: () => useState() }) will
  // not work, because the array returned from useState will break strict equality.
  // TODO: Document these cases!

  const TestContext = React.createContext({});
  const TestProvider = ({ children }) => {
    const [nameOne, setNameOne] = useState('');
    const [nameTwo, setNameTwo] = useState('');

    return (
      <TestContext.Provider value={{ nameOne, nameTwo, setNameOne, setNameTwo }}>
        {children}
      </TestContext.Provider>
    );
  };
  const withContext = Component => props => (
    <TestProvider>
      <Component {...props} />
    </TestProvider>
  );

  const useOne = () => {
    const { nameOne } = useContext(TestContext);
    return { nameOne };
  };
  const useTwo = () => {
    const { nameTwo } = useContext(TestContext);
    return { nameTwo };
  };

  let rendersOne = 0;
  let rendersTwo = 0;
  let rendersParent = 0;

  const ChildOne = ({ one, nameOne }) => {
    rendersOne++;
    return <div data-testid="one">{nameOne}</div>;
  };
  const ChildTwo = ({ two, nameTwo }) => {
    rendersTwo++;
    return <div data-testid="two">{nameTwo}</div>;
  };
  const InputChild = () => {
    const { setNameOne, setNameTwo } = useContext(TestContext);
    return (
      <>
        <input onChange={e => setNameOne(e.target.value)} placeholder="Name One" />
        <input onChange={e => setNameTwo(e.target.value)} placeholder="Name Two" />
      </>
    );
  };

  const HookedOne = composeHooks({ useOne })(ChildOne);
  const HookedMemoTwo = composeHooks({ useTwo })(React.memo(ChildTwo));

  const Parent = withContext(() => {
    rendersParent++;
    const [count, setCount] = useState(0);
    const [one, setOne] = useState(0);
    const [two, setTwo] = useState(0);

    return (
      <>
        <HookedOne one={one} />
        <HookedMemoTwo two={two} />
        <button onClick={() => setCount(c => c + 1)}>Rerender Parent</button>
        <button onClick={() => setOne(c => c + 1)}>Update Child One Props</button>
        <button onClick={() => setTwo(c => c + 1)}>Update Child Two Props</button>
        <InputChild />
      </>
    );
  });

  beforeEach(() => {
    rendersOne = 0;
    rendersTwo = 0;
    rendersParent = 0;
  });

  it('renders memoized child when props update', () => {
    const { getByText } = render(<Parent />);
    expect(rendersOne).toBe(1);
    expect(rendersTwo).toBe(1);

    fireEvent.click(getByText('Update Child Two Props'));
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(2);
  });

  it('does NOT re-render memoized child when child 2 props update', () => {
    const { getByText } = render(<Parent />);
    fireEvent.click(getByText('Update Child One Props'));
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(1);
  });

  it('does NOT render memoized child when non-subscribed context value updates', () => {
    const { getByPlaceholderText, getByTestId } = render(<Parent />);
    fireEvent.change(getByPlaceholderText(/name one/i), { target: { value: 'Calvin' } });
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(1);
    // All updates via Context so parent should not rerender
    expect(rendersParent).toBe(1);
    expect(getByTestId('one').textContent).toBe('Calvin');
    expect(getByTestId('two').textContent).toBe('');
  });

  it('renders memoized child when subscribed context value changes', () => {
    const { getByPlaceholderText, getByTestId } = render(<Parent />);
    fireEvent.change(getByPlaceholderText(/name two/i), { target: { value: 'Hobbes' } });
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(2);
    // All updates via Context so parent should not rerender
    expect(rendersParent).toBe(1);
    expect(getByTestId('one').textContent).toBe('');
    expect(getByTestId('two').textContent).toBe('Hobbes');
  });
});

describe('Naming collisions', () => {
  const useOne = () => ({ text: 'one' });
  const useTwo = () => ({ text: 'two' });
  const useNumber = () => ({ number: 1 });
  const useBool = () => ({ bool: true });
  const useNull = () => ({ null: 'not-null' });
  const origWarn = console.warn;

  beforeEach(() => {
    console.warn = jest.fn(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.warn = origWarn;
  });

  it('if prop and hook names collide, props win (not including defaultProps)', () => {
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
  });

  it('hooks override defaultProps', () => {
    const Container = composeHooks({ useOne })(TestComponent);
    const { container } = render(<Container />);
    const { container: test } = render(<TestComponent />);
    expect(test.textContent).toBe('Test');
    expect(container.textContent).toBe('one');
  });

  it('if multiple hook value names collide, last one wins', () => {
    const Container = composeHooks({ useOne, useTwo })(TestComponent);
    const wrapper = mount(<Container />);
    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
      `"prop 'text' exists, overriding with value: 'two'"`
    );
    expect(wrapper.find(TestComponent).text()).toBe('two');
  });
});
