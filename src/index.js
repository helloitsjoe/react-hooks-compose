import React from 'react';

const composeHooks = hooks => Component => {
  if (!Component) {
    throw new Error('Component must be provided to compose');
  }

  if (!hooks) {
    return Component;
  }

  return props => {
    // TODO: Potentially optimize similar to mapStateToProps in react-redux
    // https://github.com/reduxjs/react-redux/blob/master/src/connect/wrapMapToProps.js

    const hooksObject = typeof hooks === 'function' ? hooks(props) : hooks;

    // Flatten values from all hooks to a single object
    const hooksProps = Object.entries(hooksObject).reduce((acc, [hookKey, hook]) => {
      let hookValue = hook();

      if (Array.isArray(hookValue) || typeof hookValue !== 'object') {
        hookValue = { [hookKey]: hookValue };
      }

      Object.entries(hookValue).forEach(([key, value]) => {
        if (acc[key]) {
          console.warn(`prop '${key}' exists, overriding with value: ${value}`);
        }
        acc[key] = value;
      });

      return acc;
    }, {});

    return <Component {...hooksProps} {...props} />;
  };
};

export default composeHooks;
