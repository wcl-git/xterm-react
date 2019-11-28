import React from "react";
import { Terminal } from "xterm";
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import "./xterm.css";
import "./App.css";


let term; // 终端
let pid;  // 终端 id
let socket; // websocket 服务
let location = window.location;

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: ""
    };
    this.timer = null;
  }

  componentDidMount() {
    this.openInitTerminal();

  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    this.timer=null;
  }

  // 初始化打开终端
  openInitTerminal = () => {
    const terminalContainer = document.getElementById('xterm');
    // 清除容器的子节点
    while (terminalContainer.children.length) {
      terminalContainer.removeChild(terminalContainer.children[0]);
    }
  
    const isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].indexOf(navigator.platform) >= 0;
    term = new Terminal({
      windowsMode: isWindows,
      convertEol: true,
      fontFamily: `'Fira Mono', monospace`,
      fontSize: 16,
      fontWeight: 400,
      rendererType: "canvas" // canvas 或者 dom
    });

    //样式
    term.setOption("theme", {
      background: "black",
      foreground: "white"
    });

    // 加载插件
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    // 这里为窗口改变用的，可以不用，进一步开发会用到
    term.onResize((size) => {
      if (!pid) {
        return;
      }
      const cols = size.cols;
      const rows = size.rows;
      const url = 'http://localhost:3005/terminals/' + pid + '/size?cols=' + cols + '&rows=' + rows;
  
      fetch(url, {method: 'POST'});
    });

    const protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    // socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';
    let socketURL = protocol + location.hostname + ':3005' + '/terminals/';


    // 打开终端
    term.open(terminalContainer);

    term.element.style.padding = '20px';
    // 确保终端尺寸和容器尺寸一致
    fitAddon.fit();
    // 聚焦
    term.focus();

    // 调用 websoket
    this.timer = setTimeout(() => {
      fetch('http://localhost:3005/terminals?cols=' + term.cols + '&rows=' + term.rows, {method: 'POST'}).then((res) => {
        // text 是 fetch 的一个 response 方法
        res.text().then((processId) => {
          pid = processId;
          socketURL += processId;
          socket = new WebSocket(socketURL);
          socket.onopen = this.runRealTerminal();  // 真实的终端
          socket.onclose = this.runFakeTerminal(); // 模拟的终端
          socket.onerror = this.runFakeTerminal(); // 模拟的终端
        });
      });
    }, 0);
  }

  // 清除终端
  disposeTerminal = () => {
    if (term) {
      term.dispose();
      term = null;
      socket = null;
    }
  }

  // 终端连接服务
  runRealTerminal = ()=> {
    term.loadAddon(new AttachAddon(socket));
    term._initialized = true;
  }

  // 没有服务器只是一个可以输入的终端，不能做任何事情
  runFakeTerminal =()=> {
    if (term._initialized) {
      return;
    }
    term._initialized = true;  

    term.prompt = () => {
      term.write('\r\n$ ');
    };
  
    term.writeln('Welcome to xterm.js');
    term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
    term.writeln('Type some keys and commands to play around.');
    term.writeln('');
    term.prompt();
  
    term.onKey((e) => {
      const ev = e.domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
  
      if (ev.keyCode === 13) {
        term.prompt();
      } else if (ev.keyCode === 8) {
       // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          term.write('\b \b');
        }
      } else if (printable) {
        term.write(e.key);
      }
    });
  }

  render() {
    return (
      <div className="App">
      <div>
      <h1>终端</h1>
       <span onClick={this.disposeTerminal} style={{marginRight: '20px'}}>关闭</span>
       <span onClick={this.openInitTerminal}>新建</span>
      </div>
        <div id="xterm" style={{ height: "100%", width: "100%" }} />
      </div>
    );
  }
}
