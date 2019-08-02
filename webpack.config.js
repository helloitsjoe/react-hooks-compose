const {makeWebpackConfig} = require('webpack-simple');

// const config = makeWebpackConfig();

const config = makeWebpackConfig({
  entry: './src/index.js',
  output: {
    path: `${__dirname}/dist/`,
    filename: `main.js`,
    library: 'react-hooks-compose',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
});

config.externals = {
  react: 'react'
};

module.exports = config;
