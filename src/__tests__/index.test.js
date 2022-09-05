/* eslint-disable react/prop-types */
/* eslint-disable react/button-has-type */
import React, { useState, useContext, useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  text: 'Test'
};

test('passes custom hooks to component', () => {
  const MockComponent = jest.fn(() => <div>Test</div>);
  const Container = composeHooks({ useCount, useChange })(MockComponent);
  render(<Container />);
  expect(MockComponent.mock.calls[0][0]).toEqual({
    count: INITIAL_COUNT,
    value: INITIAL_VALUE,
    increment: expect.any(Function),
    decrement: expect.any(Function),
    onChange: expect.any(Function)
  });
});

test('passes props to component', () => {
  const MockComponent = jest.fn(() => <div>Test</div>);
  const Container = composeHooks({ useChange })(MockComponent);
  render(<Container foo="bar" />);
  expect(MockComponent.mock.calls[0][0].foo).toBe('bar');
});

test('hooks work as expected', () => {
  const Component = ({ value, onChange }) => (
    <label>
      Testing
      <input value={value} onChange={onChange} />
    </label>
  );
  const Container = composeHooks({ useChange })(Component);
  render(<Container />);
  expect(screen.getByLabelText(/testing/i).value).toBe(INITIAL_VALUE);
  fireEvent.change(screen.getByLabelText(/testing/i), {
    target: { value: 'new' }
  });
  expect(screen.getByLabelText(/testing/i).value).toBe('new');
});

test('works with useContext', () => {
  const TestContext = React.createContext();
  const Component = ({ value }) => <div>{value}</div>;
  const Container = composeHooks({
    value: function ContextFn() {
      return useContext(TestContext);
    }
  })(Component);
  render(
    <TestContext.Provider value="Hello">
      <Container />
    </TestContext.Provider>
  );
  expect(screen.getByText(/hello/i)).toBeTruthy();
});

test('works with custom hook that returns array', () => {
  const Component = ({ simpleHook }) => {
    const [count, setCount] = simpleHook;
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
  };
  const Container = composeHooks({ simpleHook: useUseState })(Component);
  render(<Container />);
  expect(screen.getByRole('button').textContent).toBe(INITIAL_COUNT.toString());
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button').textContent).toBe(
    (INITIAL_COUNT + 1).toString()
  );
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
  const Component = ({ setFoo, bar }) => (
    <button onClick={() => setFoo('after')}>{bar}</button>
  );
  const Container = composeHooks({ setFoo: useFoo, bar: useBar })(Component);
  render(<Container />);
  expect(outerFoo).toBe('before');
  fireEvent.click(screen.getByRole('button'));
  expect(outerFoo).toBe('after');
});

test('can pass props to hooks via function', () => {
  const TEST_VALUE = 'test-value';
  const Component = ({ value }) => value;
  const Container = composeHooks(props => ({
    useChange: () => useChange(props.initialValue)
  }))(Component);
  render(<Container initialValue={TEST_VALUE} />);
  expect(screen.getByText(TEST_VALUE)).toBeTruthy();
});

test('useEffect from custom hook', () => {
  const Component = ({ value }) => value;
  const useCustomHook = () => {
    const [value, setValue] = useState('before');
    useEffect(() => {
      setTimeout(() => {
        setValue('after');
      }, 50);
    }, []);
    return { value };
  };
  const Container = composeHooks({ useCustomHook })(Component);
  const { container } = render(<Container />);
  expect(container.textContent).toBe('before');
  return waitFor(() => {
    expect(container.textContent).toBe('after');
  });
});

describe('Edge cases', () => {
  it('returns component if no hooks', () => {
    const Container = composeHooks()(TestComponent);
    render(<Container text="some text" />);
    expect(screen.getByText(/some text/i)).toBeTruthy();
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
      <TestContext.Provider
        value={{ nameOne, nameTwo, setNameOne, setNameTwo }}
      >
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
    return (
      <>
        {one}
        <div data-testid="one">{nameOne}</div>
      </>
    );
  };
  const ChildTwo = ({ two, nameTwo }) => {
    rendersTwo++;
    return (
      <>
        {two}
        <div data-testid="two">{nameTwo}</div>
      </>
    );
  };
  const InputChild = () => {
    const { setNameOne, setNameTwo } = useContext(TestContext);
    return (
      <>
        <label>
          Name One
          <input onChange={e => setNameOne(e.target.value)} />
        </label>
        <label>
          Name Two
          <input onChange={e => setNameTwo(e.target.value)} />
        </label>
      </>
    );
  };

  const HookedOne = composeHooks({ useOne })(ChildOne);
  const HookedMemoTwo = composeHooks({ useTwo })(React.memo(ChildTwo));

  const Parent = withContext(() => {
    rendersParent++;
    const [, setCount] = useState(0);
    const [one, setOne] = useState(0);
    const [two, setTwo] = useState(0);

    return (
      <>
        <HookedOne one={one} />
        <HookedMemoTwo two={two} />
        <button onClick={() => setCount(c => c + 1)}>Rerender Parent</button>
        <button onClick={() => setOne(c => c + 1)}>
          Update Child One Props
        </button>
        <button onClick={() => setTwo(c => c + 1)}>
          Update Child Two Props
        </button>
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
    render(<Parent />);
    expect(rendersOne).toBe(1);
    expect(rendersTwo).toBe(1);

    fireEvent.click(screen.getByText('Update Child Two Props'));
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(2);
  });

  it('does NOT re-render memoized child when child 2 props update', () => {
    render(<Parent />);
    fireEvent.click(screen.getByText('Update Child One Props'));
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(1);
  });

  it('does NOT render memoized child when non-subscribed context value updates', () => {
    render(<Parent />);
    fireEvent.change(screen.getByLabelText(/name one/i), {
      target: { value: 'Calvin' }
    });
    expect(rendersOne).toBe(2);
    expect(rendersTwo).toBe(1);
    // All updates via Context so parent should not rerender
    expect(rendersParent).toBe(1);
    expect(screen.getByTestId('one').textContent).toBe('Calvin');
    expect(screen.getByTestId('two').textContent).toBe('');
  });

  it('renders memoized child when subscribed context value changes', () => {
    const { getByTestId } = render(<Parent />);
    fireEvent.change(screen.getByLabelText(/name two/i), {
      target: { value: 'Hobbes' }
    });
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
    const MockComponent = jest.fn(() => <div>Test</div>);
    const Container = composeHooks({ useOne, useNumber, useBool, useNull })(
      MockComponent
    );
    // Check falsy values, should warn for everything but undefined
    render(<Container text="" number={0} bool={false} null={null} />);
    const [first, second, third, fourth] = console.warn.mock.calls;
    expect(first[0]).toMatchInlineSnapshot(
      `"prop 'text' exists, overriding with value: ''"`
    );
    expect(second[0]).toMatchInlineSnapshot(
      `"prop 'number' exists, overriding with value: '0'"`
    );
    expect(third[0]).toMatchInlineSnapshot(
      `"prop 'bool' exists, overriding with value: 'false'"`
    );
    expect(fourth[0]).toMatchInlineSnapshot(
      `"prop 'null' exists, overriding with value: 'null'"`
    );
    const firstMockCall = MockComponent.mock.calls[0][0];
    expect(firstMockCall.text).toBe('');
    expect(firstMockCall.number).toBe(0);
    expect(firstMockCall.bool).toBe(false);
    expect(firstMockCall.null).toBe(null);
  });

  it('hooks override defaultProps', () => {
    const Container = composeHooks({ useOne })(TestComponent);
    const { container } = render(<Container />);
    expect(container.textContent).toBe('one');
    const { container: rawContainer } = render(<TestComponent />);
    expect(rawContainer.textContent).toBe('Test');
  });

  it('if multiple hook value names collide, last one wins', () => {
    const Container = composeHooks({ useOne, useTwo })(TestComponent);
    render(<Container />);
    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
      `"prop 'text' exists, overriding with value: 'two'"`
    );
    expect(screen.queryByText('two')).toBeTruthy();
    expect(screen.queryByText('text')).not.toBeTruthy();
  });
});
