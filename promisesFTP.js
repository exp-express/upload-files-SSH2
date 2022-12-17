const chalk = require('chalk')

const sftpPromise = (conn) => new Promise((resolve, reject) => {
  conn.sftp(function(err, sftp) {
    if (err) {
      console.log(chalk.red('sftp服务连接失败'))
      reject(err)
    } else {
      resolve(sftp)
    }
  })
})

const sftpStatPromise = (sftp, rpath) => new Promise((resolve, reject) => {
  sftp.stat(rpath,function(err, stats){
    if(err){
      reject(err)
    }else{
      resolve(stats)
    }
  });
})

const sftpMkdirPromise = (sftp, rpath) => new Promise((resolve, reject) => {
  sftp.mkdir(rpath,function(err){
    if(err) {
      reject(err)
    } else {
      console.log(chalk.green('创建文件夹 ' + rpath))
      resolve(rpath)
    }
  });
})


const fastPutPromise = (sftp, absolutepath,rpath ) => new Promise((resolve, reject) => {
  sftp.fastPut(absolutepath,rpath,{},function(err){
    if(err){
      console.log(chalk.red(err))
      reject(err)
    }else{
      console.log(chalk.green(`部署${absolutepath}到服务器`))
      resolve()
    }
  });
})

// 连接SSH session并执行cmd
const shellPromise = (conn, cmd) => new Promise((resolve, reject) => {
  conn.shell(function(err, stream) {
    if(err){
      console.log(chalk.red(err))
      reject(err);
    } else {
      // 执行远程cmd命令
      stream.end(cmd);

      stream.on("close", function() {
        resolve("SSH Stream :: close");
      }).on("data", function(data) {
        console.log(chalk.green(`远程执行：${data} 命令`));
      }).stderr.on("data", function(data) {
        console.log(chalk.red("STDERR: " + data));
      });
    }
  })
});

module.exports = {
  sftpPromise,
  sftpStatPromise,
  sftpMkdirPromise,
  fastPutPromise,
  shellPromise
}
