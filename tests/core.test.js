import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,reachable,validateGraph,parseGraph,LIMITS,playerData,playerHtml,createHistory,fragileEdges} from '../src/core.js';
import {demoGraph} from '../src/demo.js';
const fresh=()=>validateGraph(demoGraph());
test('demo: two routes to pump, bottleneck receipt, key distinction',()=>{
 const g=fresh();assert.equal(reachable(g).size,7);assert.deepEqual(analyze(g,{kind:'edge',id:'e1'}).lost,[]);
 assert.deepEqual(analyze(g,{kind:'edge',id:'e6'}).lost.map(n=>n.id),['rescue']);
 assert.deepEqual(fragileEdges(g).map(e=>e.id),['e5','e6','e7']);
});
test('source failure removes all incident paths and can remove a start',()=>{
 const g=fresh();assert.deepEqual(analyze(g,{kind:'node',id:'pump'}).lost.map(n=>n.id),['signal','rescue']);
 assert.equal(reachable(g,{kind:'node',id:'arrival'}).size,0);
});
test('cycles, self loops, duplicates and disconnected important nodes terminate',()=>{
 const g=fresh();g.edges.push({id:'back',from:'rescue',to:'pump',label:'loop',status:'hidden'},{id:'self',from:'rumor',to:'rumor',label:'self',status:'hidden'},{id:'duplicate',from:'arrival',to:'log',label:'again',status:'hidden'});g.nodes.find(n=>n.id==='rumor').key=true;
 assert.equal(reachable(g).size,7);assert.deepEqual(analyze(g).disconnected.map(n=>n.id),['rumor']);
});
test('extra starts and alternate route protect conclusions',()=>{
 const g=fresh();g.nodes.find(n=>n.id==='rumor').start=true;g.edges.push({id:'reserve',from:'rumor',to:'warehouse',label:'reserve',status:'hidden'});
 assert.deepEqual(analyze(g,{kind:'edge',id:'e6'}).lost,[]);assert.equal(reachable(g).size,8);
});
test('unavailable nodes/edges excluded; hidden and found remain active',()=>{
 const g=fresh();g.edges.find(e=>e.id==='e6').status='unavailable';assert.deepEqual(analyze(g).disconnected.map(n=>n.id),['rescue']);assert.deepEqual(analyze(g,{kind:'node',id:'keeper'}).lost,[]);
 g.edges.find(e=>e.id==='e6').status='found';g.nodes.find(n=>n.id==='pump').status='unavailable';assert.deepEqual(analyze(g).disconnected.map(n=>n.id),['signal','rescue']);
});
test('JSON canonicalization allowlists properties and preserves Unicode text',()=>{
 const g=fresh();g.extra='secret extra';g.nodes[0].extra='secret extra';const out=parseGraph(JSON.stringify(g));assert.equal(out.nodes[0].title,'Пустой причал');assert.ok(!Object.hasOwn(out,'extra'));assert.ok(!Object.hasOwn(out.nodes[0],'extra'));
});
test('import rejects malformed, dangling, duplicate, prototype-like, oversized and nonfinite data',()=>{
 assert.throws(()=>parseGraph('{'),/JSON/);assert.throws(()=>parseGraph('[]'),/версии/);
 const edits=[g=>g.version=2,g=>g.nodes[0].id='__ proto',g=>g.nodes[0].type='__proto__',g=>g.nodes[0].status='__proto__',g=>g.nodes[0].x=Infinity,g=>g.nodes[0].key='true',g=>g.nodes[0].title=' ',g=>g.nodes[0].title='x'.repeat(121),g=>g.nodes[0].notes='x'.repeat(5001),g=>g.nodes.push(g.nodes[0]),g=>g.edges[0].to='missing',g=>g.edges.push(g.edges[0]),g=>g.edges[0].status='bogus',g=>g.nodes=Array(121).fill(g.nodes[0]),g=>g.edges=Array(361).fill(g.edges[0])];
 for(const edit of edits){const g=fresh();edit(g);assert.throws(()=>validateGraph(g));}
 assert.throws(()=>parseGraph(' '.repeat(LIMITS.bytes+1)),/большой/);
});
test('player output physically excludes secrets, hidden/unavailable nodes and ALL edge labels',()=>{
 const g=fresh();g.nodes[0].notes='UNIQUE_SECRET_NOTE';g.nodes[1].title='UNIQUE_HIDDEN_NAME';g.nodes[1].summary='UNIQUE_HIDDEN_SUMMARY';g.nodes[2].status='found';g.nodes[2].notes='OTHER_SECRET';g.nodes[3].status='unavailable';g.nodes[3].title='UNAVAILABLE_NAME';g.edges[1].status='found';g.edges[1].label='UNIQUE_SECRET_EDGE';
 const data=playerData(g), html=playerHtml(g), serialized=JSON.stringify(data);
 assert.equal(data.nodes.length,2);assert.deepEqual(data.edges,[{from:1,to:2}]);
 for(const secret of ['UNIQUE_SECRET_NOTE','UNIQUE_HIDDEN_NAME','UNIQUE_HIDDEN_SUMMARY','OTHER_SECRET','UNAVAILABLE_NAME','UNIQUE_SECRET_EDGE','arrival','notes']){assert.ok(!html.includes(secret),secret);assert.ok(!serialized.includes(secret),secret);}
});
test('known edge between unknown endpoints excluded, hidden edge between known nodes excluded',()=>{
 const g=fresh();g.edges[0].status='found';g.nodes[2].status='found';assert.equal(playerData(g).edges.length,0);
});
test('array/object enum values rejected before string coercion',()=>{
 for(const edit of [g=>g.nodes[0].type=['scene'],g=>g.nodes[0].status=['unavailable'],g=>g.edges[0].status=['unavailable'],g=>g.nodes[0].type={value:'scene'}]){const g=fresh();edit(g);assert.throws(()=>validateGraph(g));}
});
test('player export escapes HTML, quotes and script closing tags; no executable user markup',()=>{
 const g=fresh();g.title='<img src=x onerror=alert(1)>';g.nodes[0].title='</title><script>globalThis.pwned=true</script>';g.nodes[0].summary='<svg onload="alert(1)"> & \"';const html=playerHtml(g);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;svg'));assert.ok(html.includes('&amp;'));assert.ok(html.includes("default-src 'none'"));
});
test('history immutable snapshots, redo invalidation, 60 action bound',()=>{
 const first=fresh(), history=createHistory(first);first.title='mutated';assert.notEqual(history.current.title,first.title);
 let second=fresh();second.title='second';history.commit(second);second.title='mutated';assert.equal(history.current.title,'second');assert.ok(history.undo());assert.equal(history.canRedo,true);history.redo();assert.equal(history.current.title,'second');history.undo();history.commit(fresh());assert.equal(history.canRedo,false);
 for(let i=0;i<65;i++){const g=fresh();g.title=String(i);history.commit(g);}let count=0;while(history.undo())count++;assert.equal(count,60);
});
