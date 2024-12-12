/**
 * Module for pages create/edit
 */
/**
 * @typedef {object} editorData
 * @property {{type, data}[]} blocks - array of Blocks
 * @property {string} version - used Editor version
 * @property {number} time - saving time
 */

/**
 * @typedef {object} writingSettings
 * @property {{_id, _parent, title, body: editorData}} [page] - page data for editing
 */

/**
 * @class Writing
 * @classdesc Class for create/edit pages
 */
export default class Writing {
  /**
   * Creates base properties
   */
  constructor() {
    this.editor = null;
    this.page = null; // stores Page on editing
    this.nodes = {
      editorWrapper: null,
      saveButton: null,
      removeButton: null,
      parentIdSelector: null,
      putAboveIdSelector: null,
      uriInput: null
    };
  }

  /**
   * Called by ModuleDispatcher to initialize module from DOM
   * @param {writingSettings} settings - module settings
   * @param {HTMLElement} moduleEl - module element
   */
  init(settings = {}, moduleEl) {
    /**
     * Create Editor
     */
    this.nodes.editorWrapper = document.getElementById('codex-editor');
    if (settings.page) {
      this.page = settings.page;
    }

    this.loadEditor().then((editor) => {
      this.editor = editor;
    });

    window.onbeforeunload = (e) => {
      return '';
    }

    /**
     * Activate form elements
     */
    this.nodes.saveButton = moduleEl.querySelector('[name="js-submit-save"]');
    this.nodes.saveButton.addEventListener('click', () => {
      window.onbeforeunload = null;
      this.saveButtonClicked();
    });

    this.nodes.removeButton = moduleEl.querySelector('[name="js-submit-remove"]');

    if (this.nodes.removeButton) {
      this.nodes.removeButton.addEventListener('click', () => {
        const isUserAgree = window.confirm('Are you sure?');

        if (!isUserAgree) {
          return;
        }
        window.onbeforeunload = null;
        this.removeButtonClicked();
      });
    }

    this.nodes.parentIdSelector = moduleEl.querySelector('[name="parent"]');
    this.nodes.putAboveIdSelector = moduleEl.querySelector('[name="above"]');
    this.nodes.uriInput = moduleEl.querySelector('[name="uri-input"]');

    /**
     * Set minimum margin left for main column to prevent editor controls from overlapping sidebar
     */
    document.documentElement.style.setProperty('--main-col-min-margin-left', '50px');
  };

  /**
   * Loads class for working with Editor
   * @return {Promise<Editor>}
   */
  async loadEditor() {
    const { default: Editor } = await import(/* webpackChunkName: "editor" */ './../classes/editor');

    const editorConfig = this.page ? {
      data: this.page.body
    } : {};

    return new Editor(editorConfig, {
      headerPlaceholder: 'Enter a title'
    });
  }

  /**
   * Returns all writing form data
   * @throws {Error} - validation error
   * @return {Promise.<{parent: string, body: {editorData}}>}
   */
  async getData() {
    const editorData = await this.editor.save();
    const firstBlock = editorData.blocks.length ? editorData.blocks[0] : null;
    const title = firstBlock && firstBlock.type === 'header' ? firstBlock.data.text : null;
    let uri = '';

    if (this.nodes.uriInput && this.nodes.uriInput.value) {
      if (this.nodes.uriInput.value.match(/^[a-z0-9'-]+$/i)) {
        uri = this.nodes.uriInput.value;
      } else {
        throw new Error('Uri has unexpected characters');
      }
    }

    if (!title) {
      throw new Error('Entry should start with Header');
    }

    /** get ordering selector value */
    let putAbovePageId = null;

    if (this.nodes.putAboveIdSelector) {
      putAbovePageId = this.nodes.putAboveIdSelector.value;
    }

    return {
      parent: this.nodes.parentIdSelector.value,
      putAbovePageId: putAbovePageId,
      uri: uri,
      body: editorData
    };
  }

  /**
   * Handler for clicks on the Save button
   */
  async getDynamicRootPath() {
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

  async saveButtonClicked() {
    try {
      const writingData = await this.getData();
      const rootPath = await this.getDynamicRootPath();
      const endpoint = this.page ? `${rootPath}api/page/${this.page._id}` : `${rootPath}api/page`;

      try {
        let response = await fetch(endpoint, {
          method: this.page ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(writingData)
        });

        response = await response.json();

        if (response.success) {
          // window.location.pathname = response.result.uri ? response.result.uri : '/page/' + response.result._id;
          const pageUri = response.result.uri ? response.result.uri : `page/${response.result._id}`;
          window.location.pathname = `${rootPath}${pageUri}`;
        } else {
          alert(response.error);
          console.log('Validation failed:', response.error);
        }
      } catch (sendingError) {
        console.log('Saving request failed:', sendingError);
      }
    } catch (savingError) {
      alert(savingError);
      console.log('Saving error: ', savingError);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async removeButtonClicked() {
    try {
      const rootPath = await this.getDynamicRootPath();
      const endpoint = this.page ? `${rootPath}api/page/${this.page._id}` : '';

      let response = await fetch(endpoint, {
        method: 'DELETE'
      });

      response = await response.json();
      if (response.success) {
        if (response.result && response.result._id) {
          document.location = `${rootPath}page/${response.result._id}`;
        } else {
          document.location = `${rootPath}`;
        }
      } else {
        alert(response.error);
        console.log('Server fetch failed:', response.error);
      }
    } catch (e) {
      console.log('Server fetch failed due to the:', e);
    }
  }
}
