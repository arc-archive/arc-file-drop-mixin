[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-file-drop-mixin.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-file-drop-mixin)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-file-drop-mixin.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-file-drop-mixin)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-file-drop-mixin)

## &lt;arc-file-drop-mixin&gt;

A mixin with common function used to drag and drop file import in Advanced REST Client.

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-file-drop-mixin
```

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import { ArcFileDropMixin } from '@advanced-rest-client/arc-file-drop-mixin/arc-file-drop-mixin.js';

class SampleElement extends ArcFileDropMixin(LitElement) {
  render() {
    return html`
    <h1>Drop file here</h1>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

## Development

```sh
git clone https://github.com/advanced-rest-client/arc-file-drop-mixin
cd arc-file-drop-mixin
npm install
```

### Running the tests

```sh
npm test
```

## API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)
