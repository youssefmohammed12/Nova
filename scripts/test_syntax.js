/**
 * NOVA Home - safe syntax verification for the current working tree.
 * PHP files are linted only (never executed); config/ is explicitly excluded.
 * JavaScript files are parsed only with node --check.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function collectJavaScript(directory) {
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true })
    .flatMap(entry => {
      const absolute = path.join(ROOT, directory, entry.name);
      if (entry.isDirectory()) {
        return collectJavaScript(path.relative(ROOT, absolute));
      }
      return entry.isFile() && entry.name.endsWith('.js') ? [absolute] : [];
    });
}

function run() {
  const changedPhp = execFileSync('git', ['diff', '--name-only', '--', '*.php'], {
    cwd: ROOT,
    encoding: 'utf8'
  })
    .split(/\r?\n/)
    .map(file => file.trim())
    .filter(file => file && !/^config[\\/]/i.test(file));

  for (const file of changedPhp) {
    execFileSync('php', ['-l', file], { cwd: ROOT, stdio: 'inherit' });
  }

  const javascriptFiles = [
    ...collectJavaScript('js'),
    ...collectJavaScript('scripts')
  ];

  for (const file of javascriptFiles) {
    execFileSync(process.execPath, ['--check', file], { cwd: ROOT, stdio: 'inherit' });
  }

  JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  console.log(
    '\n✅ Syntax verification passed: ' +
    changedPhp.length + ' changed PHP files linted, ' +
    javascriptFiles.length + ' JavaScript files parsed, package.json valid.'
  );
}

try {
  run();
} catch (error) {
  console.error('\n❌ Syntax verification failed.');
  console.error(error.message);
  process.exitCode = 1;
}
