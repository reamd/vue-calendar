/**
 * Created by reamd on 2017/10/12.
 */
let path = require('path'),
    webpack = require('webpack'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin'),
    WebpackMonitor = require('webpack-monitor'),
    WebpackBrowserPlugin = require('open-browser-webpack-plugin');

let development = process.env.NODE_ENV === 'development';
let production = process.env.NODE_ENV === 'production';
console.log('当前打包环境：\n *************author: reamd**************** \n development:', development, '\n production:', production, '\n ***************************************** \n');
let devPort = 8080;
let devtool = production? 'source-map' : 'cheap-module-eval-source-map'//'cheap-module-eval-source-map';

let entry = production
    ? [path.resolve(__dirname, './src/main.js')]
    : [
        path.resolve(__dirname, './src/main.js'),
        "webpack/hot/dev-server",
        "webpack-dev-server/client?http://localhost:8080"
      ];

let htmlWebpackPlugin = production
    ? new HtmlWebpackPlugin({
        title: 'vue demo',
        filename: 'index.html',
        template: 'html-withimg-loader!' + path.resolve(__dirname, 'index.html'),
        minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
        },
        sourceMap: true
    })
    : new HtmlWebpackPlugin({
        title: 'vue demo',
        filename: 'index.html',
        template: 'index.html'
    });
let plugins = production
    ? [
        new OptimizeCSSPlugin({
            sourceMap: true
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap: true
        })/*,
        new WebpackMonitor({
            capture: true, // -> default 'true'
            // target: '../monitor/myStatsStore.json', // default -> '../monitor/stats.json'
            launch: true // -> default 'false'
            // port: 3030, // default -> 8081
        })*/
      ]
    : [
        new webpack.HotModuleReplacementPlugin(),
        new WebpackBrowserPlugin({
            // browser: 'Chrome', // Firefox
            url: 'http://localhost:' + devPort
        })
    ];
plugins.push(
    new webpack.DefinePlugin({
        DEVELOPMENT: development,
        PRODUCTION: production
    }),
    htmlWebpackPlugin/*,
    new ExtractTextPlugin({
        filename:  'main.[contenthash:6].css',
        options: {
            sourceMap: true
        }
    })*/
);

module.exports = {
    devServer: {
        // inline: true,
        port: devPort
    },
    devtool : devtool,
    entry: entry,
    /*externals: {
        jquery: 'jQuery' //可以用模块方式引入但不会打包到bundle.js中
    },*/
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'main.[hash:6].js'
    },
    module: {
        rules: [
            {
                test: /\.(htm|html)$/i,
                exclude: path.join(__dirname, 'node_modules'),
                loader: 'html-withimg-loader'
            },
            /*{
                test: /\.(sass|scss)$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, './src'),
                use: ExtractTextPlugin.extract({
                    use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    importLoaders: 1,
                                    sourceMap: true
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    sourceMap: true
                                }
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: true
                                }
                            }
                        ],
                    fallback:'style-loader'

                })
            },*/
            {
                test: /\.js$/,
                include: [path.join(__dirname, './src/js')],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            },
            {
                test: /\.vue$/,
                include: [path.join(__dirname, './src')],
                use: [{
                    loader: 'vue-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            }
        ]
    },
    plugins: plugins,
    resolve: {
        alias: {
            'vue': 'vue/dist/vue.js'
        }
    }
};