'use strict';
const path = require('path');

const createContentSource = path.join('node_modules', '@ungap', 'create-content', 'esm', 'index.js');

const replacements = {
	'@ungap/assign': 'Object.assign',
	'@ungap/array-iterator': 'Array.prototype[Symbol.iterator]',
	'@ungap/custom-event': 'CustomEvent',
	'@ungap/essential-map': 'Map',
	'@ungap/essential-set': 'Set',
	'@ungap/essential-symbol': 'Symbol',
	'@ungap/essential-weakset': 'WeakSet',
	'@ungap/event': 'Event',
	'@ungap/event-target': 'EventTarget',
	'@ungap/import-node': 'document.importNode',
	'@ungap/is-array': 'Array.isArray',
	'@ungap/map': 'Map',
	'@ungap/set': 'Set',
	'@ungap/template-literal': 'val => val',
	'@ungap/trim': 'String.prototype.trim',
	'@ungap/weakmap': 'WeakMap',
	'@ungap/weakset': 'WeakSet'
};

module.exports = ({types: t, template}) => ({
	visitor: {
		Program: {
			enter() {
				this.bindings = [];
				this.specialHandlers = {
					'@ungap/create-content': true
				};
				this.ungapReplacements = {...replacements};

				const exclude = this.opts.exclude || [];
				exclude.forEach(module => {
					if (module === '@ungap/create-content') {
						this.specialHandlers['@ungap/create-content'] = false;

						return;
					}

					delete this.ungapReplacements[module];
				});
			},
			exit() {
				this.bindings.forEach(({path}) => {
					path.remove();
				});
			}
		},
		ImportDeclaration(path) {
			const source = path.get('source');
			const specifiers = path.get('specifiers');
			if (specifiers.length !== 1 || !specifiers[0].isImportDefaultSpecifier()) {
				return;
			}

			const localName = specifiers[0].node.local.name;
			const globalName = this.ungapReplacements[source.node.value];
			if (!globalName) {
				return;
			}

			if (localName === globalName) {
				path.remove();
			} else if (/^[a-zA-Z]*$/.test(globalName)) {
				this.bindings.push({
					binding: path.scope.getBinding(localName),
					globalName,
					path
				});
				// Defer removal until Program.exit, it needs to exist for the
				// binding lookup to work.
			} else {
				// BUGBUG: figure out how to directly replace usage of localName
				path.replaceWith(t.variableDeclaration('var', [
					t.variableDeclarator(t.identifier(localName), template(globalName)().expression)
				]));
			}
		},
		Identifier(path) {
			if (path.parent.type === 'ImportDefaultSpecifier') {
				return;
			}

			const binding = path.scope.getBinding(path.node.name);
			this.bindings.filter(item => item.binding === binding).forEach(({globalName}) => {
				path.replaceWith(template(globalName)());
			});
		},
		VariableDeclarator(path) {
			const {sourceFileName} = path.hub.file.opts.parserOpts;
			if (!sourceFileName) {
				return;
			}

			const {name} = path.node.id;
			if (this.specialHandlers['@ungap/create-content'] && sourceFileName.endsWith(createContentSource) && name === 'HAS_CONTENT') {
				path.get('init').replaceWith(t.booleanLiteral(true));
			}
		}
	}
});
module.exports.replacements = replacements;
