import {Platform} from 'react-native';
import {db} from '../utils/DB';
import {ToastEvent} from './EventManager';
import RNHTMLtoPDF from 'react-native-html-to-pdf-lite';
import Storage from '../utils/storage';

let RNFetchBlob;

async function saveToPDF(note) {
  let androidSavePath = '/Notesnook/exported/PDF';
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show('Failed to get storage permission');
      return null;
    }
  }
  
  await Storage.checkAndCreateDir('/exported/PDF/');
  let html = await db.notes.note(note).export('html');
  let he = require("he");
  html = he.decode(html);
  let options = {
    html: html,
    fileName:
      Platform.OS === 'ios' ? '/exported/PDF/' + note.title : note.title,
    directory: Platform.OS === 'ios' ? 'Documents' : androidSavePath,
  };
  let res = await RNHTMLtoPDF.convert(options);

  return {
    filePath: res.filePath,
    type: 'application/pdf',
    name: 'PDF',
  };
}

async function saveToMarkdown(note) {
  let path = await Storage.checkAndCreateDir('/exported/Markdown/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show('Failed to get storage permission');
      return null;
    }
  }
  RNFetchBlob = require("rn-fetch-blob");
  let markdown = await db.notes.note(note.id).export('md');

  path = path + note.title + '.md';
  await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');

  return {
    filePath: path,
    type: 'text/markdown',
    name: 'Markdown',
  };
}

async function saveToText(note) {
  let path = await Storage.checkAndCreateDir('/exported/Text/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show('Failed to get storage permission');
      return null;
    }
  }
  RNFetchBlob = require("rn-fetch-blob");
  let text = await db.notes.note(note.id).export('txt');
  path = path + note.title + '.txt';
  await RNFetchBlob.fs.writeFile(path, text, 'utf8');

  return {
    filePath: path,
    type: 'text/plain',
    name: 'Text',
  };
}

async function saveToHTML(note) {
  let path = await Storage.checkAndCreateDir('/exported/Html/');
  if (Platform.OS === 'android') {
    let hasPermission = await Storage.requestPermission();
    if (!hasPermission) {
      ToastEvent.show('Failed to get storage permission');
      return null;
    }
  }
  RNFetchBlob = require("rn-fetch-blob");
  let html = await db.notes.note(note.id).export('html');
  path = path + note.title + '.html';
  await RNFetchBlob.fs.writeFile(path, html, 'utf8');

  return {
    filePath: path,
    type: 'text/html',
    name: 'Html',
  };
}

export default {
  saveToHTML,
  saveToText,
  saveToMarkdown,
  saveToPDF,
};
