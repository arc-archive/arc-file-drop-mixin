import { fixture, assert, html } from '@open-wc/testing';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import './test-element.js';

describe('ArcFileDropMixin', function() {
  async function basicFixture() {
    return await fixture(
      html`
        <test-element></test-element>
      `
    );
  }

  describe('Basics', () => {
    function createEventObject(file) {
      const e = new CustomEvent('event', { cancelable: true });
      e.dataTransfer = {};
      if (file) {
        e.dataTransfer.files = [file];
        e.dataTransfer.types = ['Files'];
      } else {
        e.dataTransfer.types = [];
      }
      return e;
    }

    let element;
    let file;
    beforeEach(async () => {
      element = await basicFixture();
    });

    before(() => {
      file = new Blob(['{}'], { type: 'application/json' });
    });

    it('Sets dragging on drag enter', () => {
      const e = createEventObject(file);
      element._onDragEnter(e);
      assert.isTrue(element.dragging);
    });

    it("Won't set dragging when no files", () => {
      const e = createEventObject();
      element._onDragEnter(e);
      assert.isUndefined(element.dragging);
    });

    it('drag enter cancels the event', () => {
      const e = createEventObject(file);
      element._onDragEnter(e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Removes dragging on drag leave', () => {
      element._onDragLeave(createEventObject(file));
      assert.isFalse(element.dragging);
    });

    it('Ignores dragleave event when no files', () => {
      element._onDragLeave(createEventObject());
      assert.isUndefined(element.dragging);
    });

    it('drag leave cancels the event', () => {
      const e = createEventObject(file);
      element._onDragLeave(e);
      assert.isTrue(e.defaultPrevented);
    });

    it('drag over cancels the event', () => {
      const e = createEventObject(file);
      element._onDragOver(e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores drag over when no files', () => {
      const e = createEventObject();
      element._onDragOver(e);
      assert.isFalse(e.defaultPrevented);
    });

    it('drop cancels the event', () => {
      const e = createEventObject(file);
      element._onDrop(e);
      assert.isTrue(e.defaultPrevented);
    });

    it('Ignores drop when no files', () => {
      const e = createEventObject();
      element._onDrop(e);
      assert.isFalse(e.defaultPrevented);
    });

    it("Ignores the event when there's no file", () => {
      const e = createEventObject();
      const spy = sinon.spy(element, '_processEntries');
      element._onDrop(e);
      assert.isFalse(spy.called);
    });

    it('Dispatches import-process-file event', () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener('import-process-file', spy);
      element._onDrop(e);
      assert.isTrue(spy.calledOnce);
    });

    it('Dispatches process-error event when import not handled', () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener('process-error', spy);
      element._onDrop(e);
      assert.isTrue(spy.calledOnce);
    });

    it('Do not dispatches process-error event when import handled', () => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener('process-error', spy);
      element.addEventListener('import-process-file', (e) => {
        e.preventDefault();
        e.detail.result = Promise.resolve();
      });
      element._onDrop(e);
      assert.isFalse(spy.called);
    });

    it('Dispatches process-error when promise error', (done) => {
      const e = createEventObject(file);
      const spy = sinon.spy();
      element.addEventListener('process-error', spy);
      element.addEventListener('import-process-file', (e) => {
        e.preventDefault();
        e.detail.result = Promise.reject(new Error('test'));
      });
      element._onDrop(e);
      setTimeout(() => {
        assert.isTrue(spy.calledOnce);
        done();
      });
    });
  });

  describe('_notifyApiParser()', () => {
    let element;
    let file;
    beforeEach(async () => {
      element = await basicFixture();
      file = new Blob(['{}'], { type: 'application/json' });
    });

    function handler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve('test-value');
    }

    it('Calls _fire() with arguments', () => {
      const spy = sinon.spy(element, '_fire');
      element.addEventListener('api-process-file', handler);
      element._notifyApiParser(file);
      element.removeEventListener('api-process-file', handler);
      assert.isTrue(spy.called, 'Function is called');
      assert.equal(spy.args[0][0], 'api-process-file', 'First argument is set');
      assert.typeOf(spy.args[0][1].file, 'blob', 'Second argument is set');
    });

    it('Returns a promise', () => {
      element.addEventListener('api-process-file', handler);
      const result = element._notifyApiParser(file);
      element.removeEventListener('api-process-file', handler);
      assert.typeOf(result.then, 'function');
      return result;
    });

    it('Disaptches api-data-ready when finished', () => {
      const spy = sinon.spy();
      element.addEventListener('api-data-ready', spy);
      element.addEventListener('api-process-file', handler);
      return element
        ._notifyApiParser(file)
        .then(() => {
          element.removeEventListener('api-process-file', handler);
          assert.isTrue(spy.called, 'Event dispatched');
          assert.equal(spy.args[0][0].detail, 'test-value');
        })
        .catch((cause) => {
          element.removeEventListener('api-process-file', handler);
          throw cause;
        });
    });

    it('Rejects the promise when event not handled', () => {
      return element._notifyApiParser(file).catch((cause) => {
        assert.equal(cause.message, 'API processor not available');
      });
    });

    it('Disaptches "process-error" when event not handled', () => {
      const spy = sinon.spy();
      element.addEventListener('process-error', spy);
      return element._notifyApiParser(file).catch(() => {
        assert.isTrue(spy.called, 'Event dispatched');
        assert.equal(spy.args[0][0].detail.message, 'API processor not available');
      });
    });
  });

  describe('_processEntries()', () => {
    let element;
    let files;
    const acceptedType = 'application/json';

    function apiHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve('test-value');
    }

    function importHandler(e) {
      e.preventDefault();
      e.detail.result = Promise.resolve('test-value');
    }

    beforeEach(async () => {
      element = await basicFixture();
      element.addEventListener('api-process-file', apiHandler);
    });

    afterEach(() => {
      element.removeEventListener('api-process-file', apiHandler);
    });

    ['application/zip', 'application/yaml', 'application/x-yaml', 'application/raml', 'application/x-raml'].forEach(
      (item) => {
        it('Calls _notifyApiParser() when type is' + item, () => {
          const spy = sinon.spy(element, '_notifyApiParser');
          files = [new Blob(['***'], { type: item })];
          return element._processEntries(files).then(() => {
            assert.isTrue(spy.called);
            assert.isTrue(spy.args[0][0] === files[0]);
          });
        });
      }
    );

    it('Dispatches import-process-file for other types', () => {
      element.addEventListener('import-process-file', importHandler);
      files = [new Blob(['{}'], { type: acceptedType })];
      const spy = sinon.spy(element, '_fire');
      return element._processEntries(files).then(() => {
        element.removeEventListener('import-process-file', importHandler);
        assert.isTrue(spy.called);
        assert.equal(spy.args[0][0], 'import-process-file');
        assert.isTrue(spy.args[0][1].file === files[0]);
      });
    });

    it('Rejects when import-process-file not handled', () => {
      files = [new Blob(['{}'], { type: acceptedType })];
      return element
        ._processEntries(files)
        .then(() => {
          throw new Error('Should not resolve');
        })
        .catch((cause) => {
          assert.equal(cause.message, 'Import intent not handled by the application');
        });
    });

    it('Dispatches process-error when import-process-file not handled', () => {
      files = [new Blob(['{}'], { type: acceptedType })];
      const spy = sinon.spy(element, '_fire');
      return element
        ._processEntries(files)
        .then(() => {
          throw new Error('Should not resolve');
        })
        .catch(() => {
          assert.isTrue(spy.called);
          assert.equal(spy.args[1][0], 'process-error');
          assert.equal(spy.args[1][1].message, 'Import intent not handled by the application');
        });
    });

    it('Dispatches process-error when result is error', () => {
      files = [new Blob(['{}'], { type: acceptedType })];
      const spy = sinon.spy(element, '_fire');
      element.addEventListener('import-process-file', function f(e) {
        element.removeEventListener('import-process-file', f);
        e.preventDefault();
        e.detail.result = Promise.reject(new Error('test-error'));
      });
      return element
        ._processEntries(files)
        .then(() => {
          throw new Error('Should not resolve');
        })
        .catch(() => {
          assert.isTrue(spy.called);
          assert.equal(spy.args[1][0], 'process-error');
          assert.equal(spy.args[1][1].message, 'test-error');
        });
    });

    it('Dispatches process-error when result is error (as string)', () => {
      files = [new Blob(['{}'], { type: acceptedType })];
      const spy = sinon.spy(element, '_fire');
      element.addEventListener('import-process-file', function f(e) {
        element.removeEventListener('import-process-file', f);
        e.preventDefault();
        e.detail.result = Promise.reject(new Error('test-error'));
      });
      return element
        ._processEntries(files)
        .then(() => {
          throw new Error('Should not resolve');
        })
        .catch(() => {
          assert.isTrue(spy.called);
          assert.equal(spy.args[1][0], 'process-error');
          assert.equal(spy.args[1][1].message, 'test-error');
        });
    });
  });
});
