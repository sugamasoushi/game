/**
 * Electron
 * 
 * 実行可能か動作確認
 * npm run electron:dev
 * 
 * 管理者権限PowerShellで実行し、実行形式exeを作成
 * npm run electron:build
 * 
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import serve from 'electron-serve';
import fs from 'fs';
import path from 'path';

const loadURL = serve({ directory: 'out' });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), 'preload.js')
    },
  });

  ipcMain.handle('save-data', async (event, data) => {
    const filePath = path.join(app.getPath('userData'), 'savedata.json');
    try {
      fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Failed to save data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clear-save-data', async (event) => {
    const filePath = path.join(app.getPath('userData'), 'savedata.json');
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-data', async (event) => {
    const filePath = path.join(app.getPath('userData'), 'savedata.json');
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
      return null;
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  });

  // Next.jsの静的ファイルをロード
  loadURL(win);
}

app.whenReady().then(createWindow);

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});