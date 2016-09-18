require('shelljs/global')
env.NODE_ENV = 'production'

var path = require('path')
var config = require('../config')
var ora = require('ora')
var webpack = require('webpack')
var webpackConfig = require('./webpack.component.conf')
var fs = require('fs')
var co = require('co')

var filename = process.env.FILENAME

console.log(
  '  Tip:\n' +
  '  Built files are meant to be served over an HTTP server.\n' +
  "  Opening index.html over file:// won't work.\n"
)

var spinner = ora('building for production...')
spinner.start()
// scan components folder
let dirPrefix = path.resolve(__dirname, '../src/components')
let componentsFolder = fs.readdirSync(dirPrefix)
componentsFolder = componentsFolder.filter(filename => {
  return fs.statSync(`${dirPrefix}/${filename}`).isDirectory()
})
console.log('\n' + componentsFolder)
co(function* () {
  try {
    for (var i = 0;i < componentsFolder.length;i++) {
      var filename = componentsFolder[i]
      var library = makeCaml(filename)
      var src = `${dirPrefix}/${filename}`
      console.log(`build ${filename}`)
      yield buildComponent(filename, library, src)
    }
    spinner.stop()
  } catch (e) {
    spinner.stop()
    console.log(e)
  }
})

// webpack it
function buildComponent (filename, library, src) {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig(filename, library, src), function (err, stats) {
      if (err) throw err
      process.stdout.write(stats.toString({
          colors: true,
          modules: false,
          children: false,
          chunks: false,
          chunkModules: false
        }) + '\n')
      var jspath = path.resolve(__dirname, '../release/' + filename + '.js')
      var jsFile = fs.readFileSync(jspath)
      jsFile = '/*eslint-disable*/\n' + jsFile
      fs.writeFileSync(jspath, jsFile, 'utf8')
      resolve()
    })
  })
}

function makeCaml (str) {
  return str.split('-').map(item => {
    return item[0].toUpperCase() + item.substr(1)
  }).join('')
}
