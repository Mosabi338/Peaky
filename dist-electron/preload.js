"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ghostkey", {
  transcribe: (audioData, language) => electron.ipcRenderer.invoke("transcribe", audioData, language || "en"),
  generateAI: (payload) => electron.ipcRenderer.send("ai-generate", payload),
  onAIChunk: (cb) => {
    const handler = (_e, data) => cb(data);
    electron.ipcRenderer.on("ai-chunk", handler);
    return () => electron.ipcRenderer.removeListener("ai-chunk", handler);
  },
  onAIDone: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("ai-done", handler);
    return () => electron.ipcRenderer.removeListener("ai-done", handler);
  },
  captureScreen: () => electron.ipcRenderer.invoke("capture-screen"),
  copyToClipboard: (text) => electron.ipcRenderer.invoke("copy-to-clipboard", text),
  loadSettings: () => electron.ipcRenderer.invoke("load-settings"),
  saveSettings: (s) => electron.ipcRenderer.invoke("save-settings", s),
  onToggleRecording: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("toggle-recording", handler);
    return () => electron.ipcRenderer.removeListener("toggle-recording", handler);
  },
  onTriggerAI: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("trigger-ai", handler);
    return () => electron.ipcRenderer.removeListener("trigger-ai", handler);
  },
  onTriggerScreenshot: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("trigger-screenshot", handler);
    return () => electron.ipcRenderer.removeListener("trigger-screenshot", handler);
  },
  onClearAll: (cb) => {
    const handler = () => cb();
    electron.ipcRenderer.on("clear-all", handler);
    return () => electron.ipcRenderer.removeListener("clear-all", handler);
  },
  onVisibilityChanged: (cb) => {
    const handler = (_e, v) => cb(v);
    electron.ipcRenderer.on("visibility-changed", handler);
    return () => electron.ipcRenderer.removeListener("visibility-changed", handler);
  },
  onPanicMode: (cb) => {
    const handler = (_e, v) => cb(v);
    electron.ipcRenderer.on("panic-mode", handler);
    return () => electron.ipcRenderer.removeListener("panic-mode", handler);
  },
  onClickThroughChanged: (cb) => {
    const handler = (_e, v) => cb(v);
    electron.ipcRenderer.on("click-through-changed", handler);
    return () => electron.ipcRenderer.removeListener("click-through-changed", handler);
  },
  // Auto-Update
  installUpdate: () => electron.ipcRenderer.send("install-update"),
  onUpdateAvailable: (cb) => {
    const handler = (_e, v) => cb(v);
    electron.ipcRenderer.on("update-available", handler);
    return () => electron.ipcRenderer.removeListener("update-available", handler);
  },
  onUpdateProgress: (cb) => {
    const handler = (_e, p) => cb(p);
    electron.ipcRenderer.on("update-progress", handler);
    return () => electron.ipcRenderer.removeListener("update-progress", handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = (_e, v) => cb(v);
    electron.ipcRenderer.on("update-downloaded", handler);
    return () => electron.ipcRenderer.removeListener("update-downloaded", handler);
  }
});
