import React from 'react';

const composeHooks = hooks => Component => {
  if (!Component) {
    throw new Error('Component must be provided to compose');
  }

  if (!hooks) {
    return Component;
  }

  return props => {
    const hooksProps = Object.entries(hooks).reduce(
      (acc, [hookKey, hookValue]) => {
        if (Array.isArray(hookValue())) {
          acc[hookKey] = hookValue;
          return acc;
        }

        Object.entries(hookValue()).forEach(([key, value]) => {
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
