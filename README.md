# react 项目页面嵌套终端命令行工具

### 基于 xterm.js 创建的 页面嵌入 命令行终端

##启动
#### 安装依赖： npm install 

#### 启动前端： npm start 

#### 启动node服务： npm run bashServer



本项目是用 react 写的，主要逻辑 在 app.js 中


index.js 是入口文件

server.js 是 express 写的后台 websocket 服务

如果没有后台服务，只是一个空的 终端，只有服务启动起来了，才是真正的终端

当然服务器可以后台写，