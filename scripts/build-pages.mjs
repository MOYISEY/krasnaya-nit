import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await mkdir(resolve(root,'docs'),{recursive:true});
await mkdir(resolve(root,'docs/src'),{recursive:true});
for(const name of ['index.html','styles.css','favicon.svg','.nojekyll','src/app.js','src/core.js','src/demo.js'])await writeFile(resolve(root,'docs',name),(await readFile(resolve(root,name),'utf8')).replace(/\r\n/g,'\n'),'utf8');
console.log('Static Pages bundle ready: docs/');
