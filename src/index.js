import React from 'react';

const composeHooks = hooks => Component => {
  if (!Component) {
    throw new Error('Component must be provided to compose');
  }

  if (!hooks) {
    return Component;
  }

  return props => {
    // TODO: Might want to do some optimization similar to what react-redux
    // does for mapStateToProps:
    // https://github.com/reduxjs/react-redux/blob/master/src/connect/wrapMapToProps.js

    const hooksIsFunc = typeof hooks === 'function';

    const hooksObject = hooksIsFunc ? hooks(props) : hooks;

    const hooksProps = Object.entries(hooksObject).reduce(
      (acc, [hookKey, hookValue]) => {
        const hookReturnValue = hooksIsFunc ? hookValue : hookValue();

        if (Array.isArray(hookReturnValue)) {
          acc[hookKey] = hookReturnValue;
          return acc;
        }

        Object.entries(hookReturnValue).forEach(([key, value]) => {
          if (acc[key]) {
            console.warn(
              `prop '${key}' exists, overriding with value: ${value}`
            );
          }
          acc[key] = value;
        });
        return acc;
      },
      {}
    );

    return <Component {...hooksProps} {...props} />;
  };
};

export default composeHooks;
