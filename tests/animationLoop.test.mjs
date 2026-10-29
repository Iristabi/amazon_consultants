import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnimationLoop } from '../src/lib/animationLoop.mjs';
function harness() {
 let active=true,id=0; const queue=new Map(),renders=[];
 const loop=createAnimationLoop({canRun:()=>active,render:delta=>renders.push(delta),request:fn=>{queue.set(++id,fn);return id;},cancel:key=>queue.delete(key)});
 return {loop,queue,renders,setActive:value=>{active=value;},tick:now=>{const [key,fn]=queue.entries().next().value;queue.delete(key);fn(now);}};
}
test('pause/offscreen/hidden state cancels callbacks and resuming starts without a time jump',()=>{
 const h=harness();h.loop.sync();h.tick(100);h.tick(140);assert.equal(h.renders.length,2);assert.equal(h.renders[1],.04);
 h.setActive(false);h.loop.sync();assert.equal(h.queue.size,0);
 h.setActive(true);h.loop.sync();h.loop.sync();assert.equal(h.queue.size,1);h.tick(10000);assert.equal(h.renders.at(-1),0);h.loop.dispose();assert.equal(h.queue.size,0);
});
test('a state change before the queued callback prevents rendering and rescheduling',()=>{const h=harness();h.loop.sync();h.setActive(false);h.tick(100);assert.equal(h.queue.size,0);assert.equal(h.renders.length,0);});
test('throttling accumulates real elapsed time and disposal prevents restart',()=>{const h=harness();h.loop.sync();h.tick(100);h.tick(116);h.tick(133);assert.equal(h.renders.length,1);h.tick(150);assert.equal(h.renders[1],.05);h.loop.dispose();h.loop.sync();assert.equal(h.queue.size,0);});
