
const chalk = require('chalk')
const { deployStart } = require('./deploy')

// 处理远程资源部署功能
try {
  deployStart()
} catch (err) {
  console.log(chalk.red(err))
}


