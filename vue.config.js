const Components = require('unplugin-vue-components/webpack');
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');

module.exports = {
  lintOnSave: false, // 取消 eslint 验证
  assetsDir: 'rtcStatic',
  publicPath: process.env.NODE_ENV === 'production' ? '//cdn.vson.top' : '/',
  productionSourceMap: false,
  devServer: {
    port: 8090,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true, // 这一行很关键  表示是否开启  websocket
      },
    },
  },
  configureWebpack: (config) => {
    config.plugins.push(
      Components({
        resolvers: [ElementPlusResolver()],
      })
    );
  },
};
