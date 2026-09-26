import {buildSync} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('.sites-runtime/tests',{recursive:true});
buildSync({entryPoints:['tests/setup.test.ts'],outfile:'.sites-runtime/tests/setup.test.mjs',bundle:true,platform:'node',format:'esm'});
const r=spawnSync(process.execPath,['--test','.sites-runtime/tests/setup.test.mjs'],{stdio:'inherit'});process.exit(r.status??1);
