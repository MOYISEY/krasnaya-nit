import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGraph,parseGraph,LIMITS} from '../src/core.js';
test('maximum legitimate multilingual graph can roundtrip through its own backup',()=>{
 const graph={version:1,title:'界'.repeat(120),nodes:Array.from({length:LIMITS.nodes},(_,i)=>({id:'n'+i,type:'scene',title:'界'.repeat(120),summary:'界'.repeat(5000),notes:'界'.repeat(5000),status:'hidden',start:i===0,key:true,x:i,y:i})),edges:Array.from({length:LIMITS.edges},(_,i)=>({id:'e'+i,from:'n'+(i%120),to:'n'+((i+1)%120),label:'界'.repeat(120),status:'hidden'}))};
 const canonical=validateGraph(graph),text=JSON.stringify(canonical);assert.ok(new TextEncoder().encode(text).length<LIMITS.bytes);assert.deepEqual(parseGraph(text),canonical);
 for(const n of graph.nodes){n.title='\u0000'.repeat(120);n.summary='\u0000'.repeat(5000);n.notes='\u0000'.repeat(5000);}for(const e of graph.edges)e.label='\u0000'.repeat(120);graph.title='\u0000'.repeat(120);
 const escaped=JSON.stringify(validateGraph(graph),null,2);assert.ok(new TextEncoder().encode(escaped).length<LIMITS.bytes);assert.deepEqual(parseGraph(escaped),graph);
});
