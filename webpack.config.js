const {makeWebpackConfig} = require('webpack-simple');

const config1 = makeWebpackConfig({
  entry: './src/index.js',
  output: {
    path: `${__dirname}/dist/`,
    filename: `main.js`,
    library: 'react-hooks-compose',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
});

config1.externals = {
  react: 'react',
  'react-dom': 'reactDOM'
};

const config2 = makeWebpackConfig({
  entry: './src/render.js',
  output: {
    path: `${__dirname}/dist/`,
    filename: `app.js`,
    library: 'react-hooks-compose',
    libraryTarget: 'umd',
  },
  devtool: 'source-map'
});

module.exports = [config1, config2];
