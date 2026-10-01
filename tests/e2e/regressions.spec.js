import {test,expect} from '@playwright/test';
import {playerHtml} from '../../src/core.js';
import {demoGraph} from '../../src/demo.js';
test('standalone player snapshot remains readable with maximum unbroken titles on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});const graph=demoGraph();graph.title='W'.repeat(120);graph.nodes[0].title='W'.repeat(120);await page.setContent(playerHtml(graph));expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.evaluate(()=>document.documentElement.style.fontSize='200%');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('draft discard clears editor; keyboard selection preserves logical focus',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'+ Карточка',exact:true}).click();await page.locator('#node-title').fill('Отменённый черновик');page.once('dialog',d=>d.accept());await page.locator('#list-view').click();await expect(page.locator('#node-form')).toHaveCount(0);await expect(page.locator('.list-card')).toHaveCount(8);
 await page.locator('#board-view').click();const trigger=page.locator('[data-node=arrival]');await trigger.focus();await page.keyboard.press('Enter');await expect(page.locator('#inspector h2')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#node-title')).toBeFocused();await page.getByRole('button',{name:'Закрыть карточку'}).click();await expect(page.locator('[data-node=arrival]')).toBeFocused();
});
test('mobile starts with readable list, handles long titles, touch board and reduced motion',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});const page=await context.newPage();await page.goto(process.env.LIVE_URL||'http://127.0.0.1:4173');await expect(page.locator('#list-view')).toHaveAttribute('aria-pressed','true');await page.screenshot({path:'qa-local/mobile-list.png',fullPage:true});
 await page.locator('#jump-analysis').tap();await expect(page.locator('#failure-kind')).toBeFocused();
 await page.locator('.list-card').first().getByRole('button',{name:'Изменить',exact:true}).tap();await page.locator('#node-title').fill('W'.repeat(120));await page.locator('#inspector').getByRole('button',{name:'Сохранить',exact:true}).tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 await page.locator('#add-node').tap();await page.locator('#node-title').fill('Новая мобильная зацепка');await page.locator('#inspector').getByRole('button',{name:'Сохранить',exact:true}).tap();await expect(page.locator('.list-card')).toHaveCount(9);
 await page.locator('#board-view').tap();await page.locator('#zoom-in').tap();await expect(page.locator('#zoom-label')).not.toHaveText('0%');await context.close();
});
test('two simultaneous touches never move the other card',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto(process.env.LIVE_URL||'http://127.0.0.1:4173');await page.locator('#board-view').tap();await page.locator('#fit').tap();
 const first=await page.locator('[data-node=arrival]').boundingBox(),second=await page.locator('[data-node=rescue]').boundingBox();const before=await page.locator('[data-node=rescue]').getAttribute('style');const cdp=await context.newCDPSession(page),a={id:1,x:first.x+first.width/2,y:first.y+first.height/2},b={id:2,x:second.x+second.width/2,y:second.y+second.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...a,x:a.x+25},b]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[b]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.locator('[data-node=rescue]').getAttribute('style')).toBe(before);await context.close();
});
test('drag, pan, zoom, persisted coordinates and storage failure warning',async({page})=>{
 await page.goto('./');await page.locator('#zoom-in').click();const card=page.locator('[data-node=arrival]');const before=await card.getAttribute('style'),box=await card.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+40);await page.mouse.down();await page.mouse.move(box.x+box.width/2+40,box.y+70,{steps:5});await page.mouse.up();expect(await card.getAttribute('style')).not.toBe(before);await page.locator('#undo').click();expect(await card.getAttribute('style')).toBe(before);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError');};});await page.locator('#add-node').click();await page.locator('#node-title').fill('Не удалось сохранить');await page.locator('#inspector').getByRole('button',{name:'Сохранить',exact:true}).click();await expect(page.locator('#saved')).toContainText('Не сохранено');await expect(page.locator('#storage-note')).toContainText('JSON-копию');
});
