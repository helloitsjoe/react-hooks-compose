const {makeWebpackConfig} = require('webpack-simple');

const config = makeWebpackConfig();

config.externals = {
  react: 'commonjs react'
};

module.exports = config;
