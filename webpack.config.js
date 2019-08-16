const { makeWebpackConfig } = require('webpack-simple');

const config = makeWebpackConfig({
  entry: './src/index.js',
  output: {
    path: `${__dirname}/dist/`,
    filename: `main.js`,
    library: 'react-hooks-compose',
    libraryTarget: 'umd',
  },
  mode: 'production',
  devtool: 'source-map',
  externals: 'react',
});

module.exports = config;
