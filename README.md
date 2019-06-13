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

This plugin works with CJS and ES modules before bundling.  It can be run by
`rollup-plugin-babel` before import or require statements are altered.


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
	]
}
```

This config will cause any import of `@ungap/essential-map` to be preserved.


### `future` option

Some `@ungap` polyfills are needed by most current browsers or did not exist when the
current semver-major of this plugin was released.  These are only processed if explicitly
requested by the `future` option.  For example:
```js
{
	plugins: [
		['remove-ungap', {
			future: [
				'@ungap/from-entries'
			]
		}]
	]
}
```

Unknown modules are ignored.


### Modules that are removed

Module|Target|Declares variable
-|-|-
[@ungap/assign](https://github.com/ungap/assign)|Object.assign|Yes
[@ungap/array-iterator](https://github.com/ungap/array-iterator)|Array.prototype[Symbol.iterator]|Yes
[@ungap/custom-event](https://github.com/ungap/custom-event)|CustomEvent
[@ungap/essential-map](https://github.com/ungap/essential-map)|Map
[@ungap/essential-set](https://github.com/ungap/essential-set)|Set
[@ungap/essential-symbol](https://github.com/ungap/essential-symbol)|Symbol
[@ungap/essential-weakset](https://github.com/ungap/essential-weakset)|WeakSet
[@ungap/event](https://github.com/ungap/event)|Event
[@ungap/event-target](https://github.com/ungap/event-target)|EventTarget
[@ungap/import-node](https://github.com/ungap/import-node)|document.importNode|Yes
[@ungap/is-array](https://github.com/ungap/is-array)|Array.isArray|Yes
[@ungap/map](https://github.com/ungap/map)|Map
[@ungap/set](https://github.com/ungap/set)|Set
[@ungap/template-literal](https://github.com/ungap/template-literal)|val => val|Yes
[@ungap/trim](https://github.com/ungap/trim)|String.prototype.trim|Yes
[@ungap/weakmap](https://github.com/ungap/weakmap)|WeakMap
[@ungap/weakset](https://github.com/ungap/weakset)|WeakSet


### @ungap/create-content is altered

[@ungap/create-content](https://github.com/ungap/create-content) is altered so that
`HAS_CONTENT` is constant true.  This allows minifiers to strip code that is not useed
by modern browsers.


### Modules that can be removed by the `future` option

Module|Target|Declares variable
-|-|-
[@ungap/from-entries](https://github.com/ungap/from-entries)|Object.fromEntries|Yes
[@ungap/global-this](https://github.com/ungap/global-this)|globalThis
[@ungap/promise-all-settled](https://github.com/ungap/promise-all-settled)|Promise.allSettled|Yes
[@ungap/promise-any](https://github.com/ungap/promise-any)|Promise.any|Yes
[@ungap/template-tag-arguments](https://github.com/ungap/template-tag-arguments)|(...args) => args|Yes


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
