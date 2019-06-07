'use strict';
const path = require('path');

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

const futureReplacements = {
	'@ungap/from-entries': 'Object.fromEntries',
	'@ungap/global-this': 'globalThis',
	'@ungap/promise-any': 'Promise.any',
	'@ungap/template-tag-literals': '(...args) => args'
};

function getModuleName(filename) {
	if (!filename) {
		return;
	}

	const parts = filename.split(path.sep);
	if (!parts.includes('node_modules')) {
		return;
	}

	return parts
		.join(path.posix.sep)
		.replace(/.*node_modules\//, '');
}

module.exports = ({types: t, template}) => ({
	visitor: {
		Program: {
			enter() {
				this.bindings = [];
				this.specialHandlers = {
					'@ungap/create-content': true
				};
				this.ungapReplacements = {...replacements};

				const future = this.opts.future || [];
				future.forEach(module => {
					if (futureReplacements[module]) {
						this.ungapReplacements[module] = futureReplacements[module];
					}
				});

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
		CallExpression(path) {
			if (!path.parentPath.isVariableDeclarator() || !path.get('callee').isIdentifier({name: 'require'})) {
				return;
			}

			const moduleName = path.get('arguments.0');
			const idPath = path.parentPath.get('id');
			if (!moduleName.isStringLiteral() || !idPath.isIdentifier()) {
				return;
			}

			const globalName = this.ungapReplacements[moduleName.node.value];
			if (!globalName) {
				return;
			}

			const localName = idPath.node.name;
			const variableDeclarationPath = path.parentPath.parentPath;
			if (localName === globalName) {
				variableDeclarationPath.remove();
			} else if (/^[a-zA-Z]*$/.test(globalName)) {
				this.bindings.push({
					binding: variableDeclarationPath.scope.getBinding(localName),
					globalName,
					path: variableDeclarationPath
				});
				// Defer removal until Program.exit, the import needs to exist for the
				// binding lookup to work.
			} else {
				path.replaceWith(template(globalName)().expression);
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
				// Defer removal until Program.exit, the import needs to exist for the
				// binding lookup to work.
			} else {
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
		VariableDeclarator(path, state) {
			const sourceFileName = getModuleName(state.file.opts.parserOpts.sourceFileName);
			if (!sourceFileName) {
				return;
			}

			const {name} = path.node.id;
			if (this.specialHandlers['@ungap/create-content'] && sourceFileName.startsWith('@ungap/create-content') && name === 'HAS_CONTENT') {
				path.get('init').replaceWith(t.booleanLiteral(true));
			}
		}
	}
});
module.exports.replacements = replacements;
module.exports.futureReplacements = futureReplacements;
