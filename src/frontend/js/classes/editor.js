import EditorJS from '@editorjs/editorjs';

/**
 * Block Tools for the Editor
 */
import Header from '@editorjs/header';
import Image from '@editorjs/image';
import CodeTool from '@editorjs/code';
import List from '@editorjs/list';
import Delimiter from '@editorjs/delimiter';
import Table from '@editorjs/table';
import Warning from '@editorjs/warning';
import Checklist from '@editorjs/checklist';
import LinkTool from '@editorjs/link';
import RawTool from '@editorjs/raw';
import Embed from '@editorjs/embed';

/**
 * Inline Tools for the Editor
 */
import InlineCode from '@editorjs/inline-code';
import Marker from '@editorjs/marker';

/**
 * Class for working with Editor.js
 */
export default class Editor {
  /**
   * Creates Editor instance
   *
   * @param {object} editorConfig - configuration object for Editor.js
   * @param {object} data.blocks - data to start with
   * @param {object} options
   * @param {string} options.headerPlaceholder - placeholder for Header tool
   */
  constructor(editorConfig = {}, options = {}) {
    const rootPath = this.getDynamicRootPath();
    const defaultConfig = {
      tools: {
        header: {
          class: Header,
          inlineToolbar: ['marker', 'inlineCode'],
          config: {
            placeholder: options.headerPlaceholder || '',
          },
        },

        image: {
          class: Image,
          inlineToolbar: true,
          config: {
            types: 'image/*, video/mp4',
            endpoints: {
              byFile: `${rootPath}api/transport/image`,
              byUrl: `${rootPath}api/transport/fetch`,
            },
          },
        },

        linkTool: {
          class: LinkTool,
          config: {
            endpoint: `${rootPath}api/fetchUrl`,
          },
        },

        code: {
          class: CodeTool,
          shortcut: 'CMD+SHIFT+D',
        },

        list: {
          class: List,
          inlineToolbar: true,
        },

        delimiter: Delimiter,

        table: {
          class: Table,
          inlineToolbar: true,
        },

        warning: {
          class: Warning,
          inlineToolbar: true,
        },

        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },

        /**
         * Inline Tools
         */
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+C',
        },

        marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M',
        },

        raw: RawTool,

        embed: Embed,
      },
      data: {
        blocks: [
          {
            type: 'header',
            data: {
              text: '',
              level: 2,
            },
          },
        ],
      },
    };

    this.editor = new EditorJS(Object.assign(defaultConfig, editorConfig));
  }

  /**
   * Return Editor data
   *
   * @returns {Promise.<{}>}
   */
  save() {
    return this.editor.saver.save();
  }

  getDynamicRootPath() {
    // 獲取當前腳本的完整 URL
    const fullPath = window.location.pathname; // 獲取當前完整路徑
    const pathParts = fullPath.split('/'); // 拆分路徑

    // 假設腳本通常在根目錄中的某個子目錄
    // 找到代理根目錄的索引，例如 "proxy" 之前的路徑
    const proxyIndex = pathParts.findIndex(part => part === 'proxy');
    if (proxyIndex > -1) {
      return pathParts.slice(0, proxyIndex + 1).join('/') + '/'; // 返回直到 "proxy" 的完整根目錄
    }

    // 如果找不到 "proxy"，返回根路徑 "/"
    return '/';
  }
}
