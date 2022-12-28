
const fsPromises = require('fs').promises
const path = require('path')
const chalk = require('chalk')
// 解析process参数
const parseArgs = require('minimist')
// 命令行参数:
// -r (localResource) 本地待上传资源path，支持文件和文件夹
// -n (remoteProjectName) 需远程上传的服务名称
const { localResource = '', remoteProjectName = '' } = parseArgs(process.argv.slice(2), {
  alias: { r: 'localResource', n: 'remoteProjectName' }
})
const { sftpPromise, sftpStatPromise, sftpMkdirPromise, fastPutPromise, shellPromise } = require('./promisesFTP')

// 服务器项目配置路径
const projectPath = require('./projectPath')
// 当前要部署服务远程地址
const remoteProjectPath = projectPath[remoteProjectName]
// 服务根目录
const rootPath = process.cwd()
// 创建ssh2客户端
const { Client } = require('ssh2')
const conn = new Client();

// 没有待上传目录 或者 远程项目名称 结束上传流程
if (!localResource || !remoteProjectName) {
  console.log(chalk.red('请配置待上传文件路径或要上传的项目名称!'))
  process.exit(0)
}

// 远程服务器连接配置
const serverConf = {
  host: '43.138.5.12',
  port: 22,
  username: 'root',
  password: 'SGFpaGFuMTIzNDUsLnR4'
}

// 入口函数
const deployStart = () => {
  // 连接ssh2
  try {
    serverConf.password = Buffer.from(serverConf.password,'base64').toString()
    conn.on('ready', async () => {
      console.log(chalk.blue(`准备开始连接远程服务器：${serverConf.host}`))
      console.log(chalk.blue(`具体远程部署位置：${remoteProjectPath}`))

      const sftp = await sftpPromise(conn)
      // 创建远程项目的基本目录，防止在projectPath配置的path在远程不存在
      await checkAndMkdirRemotePath(sftp, remoteProjectPath)
      console.log(chalk.yellow(`1. 删除远程：${localResource} 资源`))
      await checkRemoteFile(sftp, localResource)
      console.log(chalk.yellow(`2. 开始上传本地：${localResource} 资源`))
      await readFile(sftp, localResource)
      console.log(chalk.yellow('3. done,上传完成!'))
      conn.end()
    }).connect(serverConf)
  } catch (e) {
    conn.end()
    console.log(chalk.red(e.message))
  }
}

// 删除远程服务器重复的文件（待上传目标）
const checkRemoteFile = async (sftp, localResource) => {
  return Promise.resolve().then(async () => {
    try {
      const remoteFullFilePath = path.join(remoteProjectPath, localResource)
      const isExistFile = await sftpStatPromise(sftp, remoteFullFilePath)
      if (isExistFile) {
        const shellCmd =
          `
          rm -rf ${remoteFullFilePath}
          exit
          `
        await shellPromise(conn, shellCmd)
      }
    } catch (err) {
      // No such File
      if (err?.code === 2) {
        console.log(chalk.yellow('远程机器没有此文件'))
      }
    }
  })
}

// 读取本地文件
const readFile = async (sftp, localResource) => {
  return Promise.resolve().then(async () => {
    const fullFilePath = path.join(rootPath, localResource)
    const remoteFullFilePath = path.join(remoteProjectPath, localResource)

    try {
      const stats = await fsPromises.stat(fullFilePath)
      if (stats.isFile(fullFilePath)) {
        // 文件的话截取具体文件名称前的path
        const remotePurePath = remoteFullFilePath.split('/').slice(0, -1).join('/')
        await checkAndMkdirRemotePath(sftp, remotePurePath)
        await fastPutPromise(sftp, fullFilePath, remoteFullFilePath)
      } else {
        await checkAndMkdirRemotePath(sftp, remoteFullFilePath)
        const list = await fsPromises.readdir(fullFilePath)
        for (let i = 0; i < list.length; i++) {
          const joinPath = `${localResource}/${list[i]}`
          await readFile(sftp, joinPath)
        }
      }
    } catch (e) {
      console.log(chalk.red(e))
    }
  })
}

// 检查并创建远程文件夹
const checkAndMkdirRemotePath = (sftp, remotePath) => {
  return new Promise(async (resolve) => {
    let pathArr = remotePath.split('/')
    let tempPathArr = []
    pathArr.reduce((pre, curr) => {
      tempPathArr.push(pre + '/' + curr)
      return pre + '/' + curr
    })
    for (let path of tempPathArr) {
      try {
        await sftpStatPromise(sftp, path)
      } catch (err) {
        // No such File
        if (err?.code === 2) {
          await sftpMkdirPromise(sftp, path)
        }
      }
    }
    resolve('done')
  })
}

module.exports = {
  deployStart
}
