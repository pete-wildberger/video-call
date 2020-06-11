const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
	{
		name: 'dev',
		entry: ['./src/client/main.ts'],
		mode: 'development',
		resolve: {
			extensions: ['.ts', '.tsx', '.js']
		},
		output: {
			path: path.join(__dirname, '/dist'),
			filename: 'bundle.min.js',
			publicPath: '/'
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'awesome-typescript-loader'
				},
				{
					test: /\.(scss|css)$/,
					use: [
						// Creates `style` nodes from JS strings
						MiniCssExtractPlugin.loader,
						'css-loader',
						// Translates CSS into CommonJS
						// Compiles Sass to CSS
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(ttf|png|eot|ico|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
					use: [
						{
							loader: 'file-loader'
						}
					]
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: '[name].css'
			}),

			new HtmlWebpackPlugin({
				template: './src/client/index.html'
			}),
			new webpack.HotModuleReplacementPlugin({})
		]
	},
	{
		name: 'production',
		entry: './src/client/main.ts',
		mode: 'production',
		resolve: {
			extensions: ['.ts', '.tsx', '.js']
		},
		output: {
			path: path.join(__dirname, '/dist'),
			chunkFilename: '[id].bundle.js',
			filename: 'bundle.min.js',
			publicPath: '/'
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'awesome-typescript-loader'
				},
				{
					test: /\.(scss|css)$/,
					use: [
						// Creates `style` nodes from JS strings
						MiniCssExtractPlugin.loader,
						'css-loader',
						// Translates CSS into CommonJS
						// Compiles Sass to CSS
						{
							loader: 'sass-loader',
							options: {
								sassOptions: {
									outputStyle: 'compressed'
								}
							}
						}
					]
				},
				{
					test: /\.(ttf|png|eot|ico|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
					use: [
						{
							loader: 'file-loader'
						}
					]
				}
			]
		},
		optimization: {
			minimizer: [new OptimizeCSSAssetsPlugin({})],
			splitChunks: {
				chunks: 'all'
			}
		},
		plugins: [
			new CleanWebpackPlugin(),
			new HtmlWebpackPlugin({
				template: './src/client/index.html',
				minify: true
			}),
			new MiniCssExtractPlugin({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: '[name].css',
				chunkFilename: '[id].css'
			})
		],
		optimization: {
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						ecma: 6,
						compress: {
							drop_console: true
						}
					}
				}),
				new OptimizeCSSAssetsPlugin({
					cssProcessorPluginOptions: {
						preset: ['default', { discardComments: { removeAll: true } }]
					},
					canPrint: true
				})
			],
			splitChunks: {
				chunks: 'all'
			},
			usedExports: true
		}
	},
	{
		name: 'hot',
		entry: ['./src/client/main.ts', 'webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8080'],
		mode: 'development',
		resolve: {
			extensions: ['.ts', '.tsx', '.js']
		},
		output: {
			path: path.join(__dirname, '/dist'),
			filename: 'bundle.min.js',
			publicPath: '/'
		},
		devtool: 'inline-source-map',
		devServer: {
			hot: true,
			proxy: {
				'/**': {
					//catch all requests
					target: '/index.html', //default target
					secure: false,
					bypass: function (req, res, opt) {
						//your custom code to check for any exceptions
						//console.log('bypass check', {req: req, res:res, opt: opt});
						if (req.path.indexOf('/img/') !== -1 || req.path.indexOf('/public/') !== -1) {
							return '/';
						}

						if (req.headers.accept.indexOf('html') !== -1) {
							return '/index.html';
						}
					}
				}
			}
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'awesome-typescript-loader'
				},
				{
					test: /\.(scss|css)$/,
					use: [
						// Creates `style` nodes from JS strings
						MiniCssExtractPlugin.loader,
						'css-loader',
						// Translates CSS into CommonJS
						// Compiles Sass to CSS
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true
							}
						}
					]
				},
				{
					test: /\.(ttf|png|eot|ico|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
					use: [
						{
							loader: 'file-loader'
						}
					]
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: '[name].css'
			}),

			new HtmlWebpackPlugin({
				template: './src/client/index.html'
			}),
			new webpack.HotModuleReplacementPlugin({})
		]
	}
];
