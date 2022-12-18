## 利用ssh2的sftp服务上传资源到远程服务器

### 使用说明
1. 全局安装：npm install -g upload-files-ssh2
2. 项目package.json配置命令：

>命令行参数:
```
-r (localResource) 本地待上传资源path，支持文件和文件夹
-n (remoteProjectName) 需远程上传的服务名称
```

> demo：
```
"deploy": "upload-remote -r ./hi-user -n hi-user"
```
