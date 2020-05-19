'use strict';
const path = require('path');

const t = require('libtap');
const {transform} = require('@babel/core');

const plugin = require('..');

const {replacements, futureReplacements} = plugin;
const test = (name, helper, ...args) => t.test(name, t => helper(t, ...args));

async function babelTest(t, {source, result, options, filename}) {
	const babelrc = {
		babelrc: false,
		configFile: false,
		compact: true
	};

	const {code} = transform(source, {...babelrc, filename, plugins: [[plugin, options]]});
	const {code: actual} = transform(result, babelrc);

	t.equal(code, actual);
}

function genSource(module, importDestination, require = false) {
	if (require) {
		return `
			var ${importDestination} = require("${module}");
			console.log(typeof ${importDestination});
			${importDestination}();
		`;
	}

	return `
		import ${importDestination} from "${module}";
		console.log(typeof ${importDestination});
		${importDestination}();
	`;
}

function genResult(statement) {
	return `
		console.log(typeof ${statement});
		${statement}();
	`;
}

Object.entries(replacements).forEach(([module, statement]) => {
	const isBasic = /^[a-zA-Z]*$/u.test(statement);

	if (isBasic) {
		test(`removes default import ${module}`, babelTest, {
			source: genSource(module, statement),
			result: genResult(statement)
		});

		test(`replaces non-default import ${module}`, babelTest, {
			source: genSource(module, 'AlternativeName'),
			result: genResult(statement)
		});

		test(`removes default require ${module}`, babelTest, {
			source: genSource(module, statement, true),
			result: genResult(statement)
		});

		test(`removes non-default require ${module}`, babelTest, {
			source: genSource(module, 'AlternativeName', true),
			result: genResult(statement)
		});
	} else {
		test(`replaces import ${module}`, babelTest, {
			source: genSource(module, 'testImportName'),
			result: `
				var testImportName = ${statement};
				console.log(typeof testImportName);
				testImportName();
			`
		});

		test(`replaces require ${module}`, babelTest, {
			source: genSource(module, 'testImportName', true),
			result: `
				var testImportName = ${statement};
				console.log(typeof testImportName);
				testImportName();
			`
		});
	}

	test(`exclude import ${module}`, babelTest, {
		source: genSource(module, 'testImportName'),
		result: genSource(module, 'testImportName'),
		options: {
			exclude: [module]
		}
	});

	test(`exclude require ${module}`, babelTest, {
		source: genSource(module, 'testImportName', true),
		result: genSource(module, 'testImportName', true),
		options: {
			exclude: [module]
		}
	});
});

Object.entries(futureReplacements).forEach(([module, statement]) => {
	const isBasic = /^[a-zA-Z]*$/u.test(statement);
	const options = {
		future: [module]
	};

	if (isBasic) {
		test(`removes default import ${module} if requested`, babelTest, {
			source: genSource(module, statement),
			result: genResult(statement),
			options
		});

		test(`leaves default import ${module} if not requested`, babelTest, {
			source: genSource(module, statement),
			result: genSource(module, statement)
		});

		test(`replaces non-default import ${module} if requested`, babelTest, {
			source: genSource(module, 'AlternativeName'),
			result: genResult(statement),
			options
		});

		test(`leaves non-default import ${module} if not requested`, babelTest, {
			source: genSource(module, 'AlternativeName'),
			result: genSource(module, 'AlternativeName')
		});

		test(`removes default require ${module} if requested`, babelTest, {
			source: genSource(module, statement, true),
			result: genResult(statement),
			options
		});

		test(`leaves default require ${module} if not requested`, babelTest, {
			source: genSource(module, statement, true),
			result: genSource(module, statement, true)
		});

		test(`removes non-default require ${module} if requested`, babelTest, {
			source: genSource(module, 'AlternativeName', true),
			result: genResult(statement),
			options
		});

		test(`leaves non-default require ${module} if not requested`, babelTest, {
			source: genSource(module, 'AlternativeName', true),
			result: genSource(module, 'AlternativeName', true)
		});
	} else {
		test(`replaces import ${module} if requested`, babelTest, {
			source: genSource(module, 'testImportName'),
			result: `
				var testImportName = ${statement};
				console.log(typeof testImportName);
				testImportName();
			`,
			options
		});

		test(`leaves import ${module} if not requested`, babelTest, {
			source: genSource(module, 'testImportName'),
			result: genSource(module, 'testImportName')
		});

		test(`replaces require ${module} if requested`, babelTest, {
			source: genSource(module, 'testImportName', true),
			result: `
				var testImportName = ${statement};
				console.log(typeof testImportName);
				testImportName();
			`,
			options
		});

		test(`leaves require ${module} if not requested`, babelTest, {
			source: genSource(module, 'testImportName', true),
			result: genSource(module, 'testImportName', true)
		});
	}

	test(`exclude import ${module} after requesting it`, babelTest, {
		source: genSource(module, 'testImportName'),
		result: genSource(module, 'testImportName'),
		options: {
			future: [module],
			exclude: [module]
		}
	});

	test(`exclude require ${module} after requesting it`, babelTest, {
		source: genSource(module, 'testImportName', true),
		result: genSource(module, 'testImportName', true),
		options: {
			future: [module],
			exclude: [module]
		}
	});
});

test('ignores imports without local name', babelTest, {
	source: 'import "@ungap/weakmap";',
	result: 'import "@ungap/weakmap";'
});

test('ignores imports with multiple local names', babelTest, {
	source: 'import WeakMap, {default as alternate} from "@ungap/weakmap";',
	result: 'import WeakMap, {default as alternate} from "@ungap/weakmap";'
});

test('ignores named imports', babelTest, {
	source: 'import {WeakMap} from "@ungap/weakmap";',
	result: 'import {WeakMap} from "@ungap/weakmap";'
});

test('ignores unassigned require', babelTest, {
	source: 'require("@ungap/weakmap");',
	result: 'require("@ungap/weakmap");'
});

test('ignores named require', babelTest, {
	source: 'const {WeakMap} = require("@ungap/weakmap");',
	result: 'const {WeakMap} = require("@ungap/weakmap");'
});

test('rewrites HAS_CONTENT in @ungap/create-content/index.js', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = true;',
	filename: path.join('node_modules', '@ungap', 'create-content', 'index.js')
});

test('rewrites HAS_CONTENT in @ungap/create-content/cjs/index.js', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = true;',
	filename: path.join('node_modules', '@ungap', 'create-content', 'cjs', 'index.js')
});

test('rewrites HAS_CONTENT in @ungap/create-content/esm/index.js', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = true;',
	filename: path.join('node_modules', '@ungap', 'create-content', 'esm', 'index.js')
});

test('exclude @ungap/create-content', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = \'content\' in document;',
	filename: path.join('node_modules', '@ungap', 'create-content', 'esm', 'index.js'),
	options: {
		exclude: ['@ungap/create-content']
	}
});

test('ignores HAS_CONTENT outside of @ungap/create-content', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = \'content\' in document;',
	filename: path.join('node_modules', '@ungap', 'something-else', 'esm', 'index.js')
});

test('ignores HAS_CONTENT outside of node_modules', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = \'content\' in document;',
	filename: path.join('@ungap', 'create-content', 'esm', 'index.js')
});

test('tolerates HAS_CONTENT in source without filename', babelTest, {
	source: 'var HAS_CONTENT = \'content\' in document;',
	result: 'var HAS_CONTENT = \'content\' in document;'
});

test('ignores unknown module in options.future', babelTest, {
	source: genSource('@ungap/this-module-will-never-exist', 'destVariable'),
	result: genSource('@ungap/this-module-will-never-exist', 'destVariable'),
	options: {
		future: ['@ungap/this-module-will-never-exist']
	}
});
