/**
 * 実行可能か動作確認
 * npm run electron:dev
 * 
 * 管理者権限PowerShellで実行し、実行形式exeを作成
 * npm run electron:build
 * 
 */

import { app, BrowserWindow } from 'electron';
import serve from 'electron-serve';

const loadURL = serve({ directory: 'out' });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Next.jsの静的ファイルをロード
  loadURL(win);
}

app.whenReady().then(createWindow);

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});