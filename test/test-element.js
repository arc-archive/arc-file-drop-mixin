import { LitElement, html, css } from 'lit-element';
import { ArcFileDropMixin } from '../arc-file-drop-mixin.js';
/**
 * @customElement
 * @demo demo/index.html
 * @appliesMixin ArcFileDropMixin
 */
class TestElement extends ArcFileDropMixin(LitElement) {
  static get styles() {
    return css`:host {
      display: block;
    }`;
  }

  render() {
    return html``;
  }
}
window.customElements.define('test-element', TestElement);
