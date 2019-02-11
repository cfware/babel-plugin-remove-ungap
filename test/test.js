import path from 'path';

import test from 'ava';
import {transform} from '@babel/core';

import plugin, {replacements, futureReplacements} from '..';

function babelTest(t, {source, result, opts, filename}) {
	const babelrc = {
		babelrc: false,
		configFile: false,
		compact: true
	};

	const {code} = transform(source, {...babelrc, filename, plugins: [[plugin, opts]]});
	const {code: actual} = transform(result, babelrc);

	t.is(code, actual);
}

function genSource(module, importDest, require = false) {
	if (require) {
		return `
			var ${importDest} = require("${module}");
			console.log(typeof ${importDest});
			${importDest}();
		`;
	}

	return `
		import ${importDest} from "${module}";
		console.log(typeof ${importDest});
		${importDest}();
	`;
}

function genResult(statement) {
	return `
		console.log(typeof ${statement});
		${statement}();
	`;
}

Object.entries(replacements).forEach(([module, statement]) => {
	const isBasic = /^[a-zA-Z]*$/.test(statement);

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
		opts: {
			exclude: [module]
		}
	});

	test(`exclude require ${module}`, babelTest, {
		source: genSource(module, 'testImportName', true),
		result: genSource(module, 'testImportName', true),
		opts: {
			exclude: [module]
		}
	});
});

Object.entries(futureReplacements).forEach(([module, statement]) => {
	const isBasic = /^[a-zA-Z]*$/.test(statement);
	const opts = {
		future: [module]
	};

	if (isBasic) {
		test(`removes default import ${module} if requested`, babelTest, {
			source: genSource(module, statement),
			result: genResult(statement),
			opts
		});

		test(`leaves default import ${module} if not requested`, babelTest, {
			source: genSource(module, statement),
			result: genSource(module, statement)
		});

		test(`replaces non-default import ${module} if requested`, babelTest, {
			source: genSource(module, 'AlternativeName'),
			result: genResult(statement),
			opts
		});

		test(`leaves non-default import ${module} if not requested`, babelTest, {
			source: genSource(module, 'AlternativeName'),
			result: genSource(module, 'AlternativeName')
		});

		test(`removes default require ${module} if requested`, babelTest, {
			source: genSource(module, statement, true),
			result: genResult(statement),
			opts
		});

		test(`leaves default require ${module} if not requested`, babelTest, {
			source: genSource(module, statement, true),
			result: genSource(module, statement, true)
		});

		test(`removes non-default require ${module} if requested`, babelTest, {
			source: genSource(module, 'AlternativeName', true),
			result: genResult(statement),
			opts
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
			opts
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
			opts
		});

		test(`leaves require ${module} if not requested`, babelTest, {
			source: genSource(module, 'testImportName', true),
			result: genSource(module, 'testImportName', true)
		});
	}

	test(`exclude import ${module} after requesting it`, babelTest, {
		source: genSource(module, 'testImportName'),
		result: genSource(module, 'testImportName'),
		opts: {
			future: [module],
			exclude: [module]
		}
	});

	test(`exclude require ${module} after requesting it`, babelTest, {
		source: genSource(module, 'testImportName', true),
		result: genSource(module, 'testImportName', true),
		opts: {
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
	opts: {
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

test('ignores unknown module in opts.future', babelTest, {
	source: genSource('@ungap/this-module-will-never-exist', 'destVariable'),
	result: genSource('@ungap/this-module-will-never-exist', 'destVariable'),
	opts: {
		future: ['@ungap/this-module-will-never-exist']
	}
});
