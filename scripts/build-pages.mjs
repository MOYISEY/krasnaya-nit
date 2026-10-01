import {mkdir,copyFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await mkdir(resolve(root,'docs'),{recursive:true});
for(const name of ['index.html','styles.css','favicon.svg','.nojekyll'])await copyFile(resolve(root,name),resolve(root,'docs',name));
await cp(resolve(root,'src'),resolve(root,'docs/src'),{recursive:true});
console.log('Static Pages bundle ready: docs/');
