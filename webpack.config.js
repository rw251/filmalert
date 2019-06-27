const HtmlWebPackPlugin = require('html-webpack-plugin');
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const RollbarDeployPlugin = require('rollbar-deploy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
//const WorkboxPlugin = require('workbox-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const path = require('path');
const { execSync } = require('child_process');
const { version } = require('./package.json');

const rollbarClientToken = '77a1cca09ae9435d96ef2befaad1b8e5';
const rollbarServerToken = 'e02c663c86cf487d95d296139470953f';
const publicPath = '/';

const SOURCE_VERSION =
  process.env.SOURCE_VERSION ||
  execSync('git rev-parse --short HEAD').toString();
const USER = execSync('whoami').toString();

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';
  const config = {
    output: {
      path: path.join(__dirname, 'dist', 'public_html', 'film'),
      publicPath,
      filename: '[hash].js',
      chunkFilename: '[chunkhash].js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
            },
          },
        },
        {
          test: /\.html$/,
          include: path.resolve(__dirname, 'src', 'client'),
          use: [
            {
              loader: 'html-loader',
              options: { minimize: !isDev },
            },
          ],
        },
        {
          test: /\.scss$/,
          include: path.resolve(__dirname, 'src', 'client', 'styles'),
          use: [
            'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist', 'public_html', 'film'),
      compress: true,
      historyApiFallback: {
        index: '/index.html',
      },
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebPackPlugin({
        template: path.resolve(__dirname, 'src', 'client', 'index.html'),
        filename: 'index.html',
      }),
      !isDev &&
      new HtmlReplaceWebpackPlugin([
        {
          pattern: '@@ROLLBAR_TOKEN',
          replacement: rollbarClientToken,
        },
        {
          pattern: '@@VERSION',
          replacement: version,
        },
      ]),
      !isDev &&
      new RollbarSourceMapPlugin({
        accessToken: rollbarServerToken,
        version,
        publicPath: '//film.rw251.com',
      }),
      !isDev &&
      new RollbarDeployPlugin({
        accessToken: rollbarServerToken,
        environment: 'production',
        revision: SOURCE_VERSION,
        localUsername: USER,
      }),
      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name].[hash].css',
        chunkFilename: isDev ? '[id].css' : '[id].[hash].css',
      }),
      new CopyWebpackPlugin([{ from: './src/client/static' }]),
      new CopyWebpackPlugin([{ from: './src/server', to: path.join(__dirname, 'dist')}]),
      new CopyWebpackPlugin([
        {
          from: './src/client/service-worker.js',
          transform (content) {
            const parsed = content.toString().replace(/\{\{VERSION\}\}/g, version).replace(/\{\{RANDOM\}\}/g, Math.random());
            return Buffer.from(parsed, 'utf8');
          }
        }
      ]),
      new ManifestPlugin({fileName: 'webpack-manifest.json'}),
      // new WorkboxPlugin.GenerateSW({
      //   // these options encourage the ServiceWorkers to get in there fast
      //   // and not allow any straggling "old" SWs to hang around
      //   clientsClaim: true,
      //   skipWaiting: true,
      //   exclude: [
      //     /\.map$/,
      //     /^manifest.*\.js(?:on)?$/,
      //     /\.htaccess/,
      //     /\.php$/,
      //   ],
      //   navigateFallback: '/',
      //   runtimeCaching: [
      //     {
      //       urlPattern: /^http.*polyfill.min.js/,
      //       handler: 'staleWhileRevalidate',
      //     },
      //     {
      //       urlPattern: /^http.*rollbar.min.js/,
      //       handler: 'staleWhileRevalidate',
      //     },
      //     {
      //       urlPattern: /index.html/,
      //       handler: 'staleWhileRevalidate',
      //     },
      //   ],
      // }),
    ].filter(Boolean),
    devtool: isDev ? 'eval-source-map' : 'hidden-source-map',
  };
  return config;
};
