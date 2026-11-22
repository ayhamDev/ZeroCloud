import { product } from '@zerocloud/share-core';
import { BrowserWindow } from 'electrobun/main/browser-window';

const mainWindow = new BrowserWindow({
  title: product.name,
  url: 'views://mainview/index.html',
  frame: { width: 1100, height: 760, x: 120, y: 80 },
});
mainWindow.webview.setNavigationRules(['views://mainview/*']);
