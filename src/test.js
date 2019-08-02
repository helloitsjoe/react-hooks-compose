import React, {useState} from 'react';
import composeHooks from '../dist/main';

const useCount = () => {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  return { count, increment, decrement };
};

const CountPresenter = ({ count, increment, decrement }) => {
  return (
    <div className="Counter">
      <h1>Current count is: {count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  );
};

export default composeHooks({ useCount })(CountPresenter);
