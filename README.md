# babel-plugin-remove-ungap

[![Travis CI][travis-image]][travis-url]
[![Greenkeeper badge][gk-image]](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![MIT][license-image]](LICENSE)

Remove @ungap ponyfills

### Install babel-plugin-remove-ungap

```sh
npm i -D babel-plugin-remove-ungap
```

## Usage

Add `remove-ungap` to your babelrc plugins if the ponyfills are not needed by your
browser target.  This could be due to only targeting modern browsers or because
your project already polyfills the browser.

This plugin currently only works on ES modules before bundling.  It can be run by
`rollup-plugin-babel` before import statements are altered.

### `exclude` option

You can add the `exclude` option to block removal/processing of specific @ungap modules.

```js
{
	plugins: [
		['remove-ungap', {
			exclude: [
				'@ungap/essential-map'
			]
		}]
}
```

This config will cause any import of `@ungap/essential-map` to be preserved.

### Modules that are removed

* [@ungap/assign](https://github.com/ungap/assign)
* [@ungap/array-iterator](https://github.com/ungap/array-iterator)
* [@ungap/custom-event](https://github.com/ungap/custom-event)
* [@ungap/essential-map](https://github.com/ungap/essential-map)
* [@ungap/essential-set](https://github.com/ungap/essential-set)
* [@ungap/essential-symbol](https://github.com/ungap/essential-symbol)
* [@ungap/essential-weakset](https://github.com/ungap/essential-weakset)
* [@ungap/event](https://github.com/ungap/event)
* [@ungap/event-target](https://github.com/ungap/event-target)
* [@ungap/import-node](https://github.com/ungap/import-node)
* [@ungap/is-array](https://github.com/ungap/is-array)
* [@ungap/map](https://github.com/ungap/map)
* [@ungap/set](https://github.com/ungap/set)
* [@ungap/template-literal](https://github.com/ungap/template-literal)
* [@ungap/trim](https://github.com/ungap/trim)
* [@ungap/weakmap](https://github.com/ungap/weakmap)
* [@ungap/weakset](https://github.com/ungap/weakset)

### @ungap/create-content is altered

[@ungap/create-content](https://github.com/ungap/create-content) is altered so that
`HAS_CONTENT` is constant true.  This allows minifiers to strip code that is not useed
by modern browsers.

## Running tests

Tests are provided by xo and ava.

```sh
npm install
npm test
```

[npm-image]: https://img.shields.io/npm/v/babel-plugin-remove-ungap.svg
[npm-url]: https://npmjs.org/package/babel-plugin-remove-ungap
[travis-image]: https://travis-ci.org/cfware/babel-plugin-remove-ungap.svg?branch=master
[travis-url]: https://travis-ci.org/cfware/babel-plugin-remove-ungap
[gk-image]: https://badges.greenkeeper.io/cfware/babel-plugin-remove-ungap.svg
[downloads-image]: https://img.shields.io/npm/dm/babel-plugin-remove-ungap.svg
[downloads-url]: https://npmjs.org/package/babel-plugin-remove-ungap
[license-image]: https://img.shields.io/npm/l/babel-plugin-remove-ungap.svg
