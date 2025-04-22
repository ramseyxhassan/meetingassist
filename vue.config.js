const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '',
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      const env = process.env
      args[0]['process.env'] = Object.keys(env).reduce((acc, key) => {
        if (key.startsWith('VUE_APP_')) {
          acc[key] = JSON.stringify(env[key])
        }
        return acc
      }, {})
      return args
    })
  }
})