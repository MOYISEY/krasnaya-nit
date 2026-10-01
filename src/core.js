export const LIMITS = Object.freeze({nodes:120, edges:360, bytes:8000000, title:120, text:5000});
export const TYPES = {scene:'Сцена', person:'Персонаж', place:'Локация', conclusion:'Вывод'};
export const STATES = {hidden:'Не раскрыто', found:'Раскрыто', unavailable:'Недоступно'};
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const fail = message => { throw new Error(message); };
const str = (value, max, name) => typeof value === 'string' && value.length <= max ? value : fail(`Поле «${name}» должно быть текстом до ${max} символов.`);
const boolean = (value, name) => typeof value === 'boolean' ? value : fail(`Поле «${name}» должно быть true или false.`);
const coordinate = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 10000 ? value : fail('Координаты должны быть числами от −10000 до 10000.');
export function validateGraph(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) fail('Нужен файл «Красной нити» версии 1.');
  if (!Array.isArray(raw.nodes) || raw.nodes.length > LIMITS.nodes) fail(`Не более ${LIMITS.nodes} карточек.`);
  if (!Array.isArray(raw.edges) || raw.edges.length > LIMITS.edges) fail(`Не более ${LIMITS.edges} связей.`);
  const ids = new Set();
  const nodes = raw.nodes.map(n => {
    if (!n || !validId(n.id) || ids.has(n.id)) fail('У карточек должны быть уникальные безопасные ID.');
    ids.add(n.id);
    if (typeof n.type !== 'string' || typeof n.status !== 'string' || !Object.hasOwn(TYPES,n.type) || !Object.hasOwn(STATES,n.status)) fail('Неизвестный тип или состояние карточки.');
    const title = str(n.title,LIMITS.title,'Название'); if (!title.trim()) fail('Название карточки не может быть пустым.');
    return {id:n.id,type:n.type,title,summary:str(n.summary,LIMITS.text,'Текст для игроков'),notes:str(n.notes,LIMITS.text,'Заметки ведущего'),status:n.status,start:boolean(n.start,'Старт'),key:boolean(n.key,'Ключевой вывод'),x:coordinate(n.x),y:coordinate(n.y)};
  });
  const edgeIds = new Set();
  const edges = raw.edges.map(e => {
    if (!e || !validId(e.id) || edgeIds.has(e.id)) fail('У связей должны быть уникальные безопасные ID.');
    edgeIds.add(e.id);
    if (!ids.has(e.from) || !ids.has(e.to)) fail('Связь ссылается на отсутствующую карточку.');
    return {id:e.id,from:e.from,to:e.to,label:str(e.label,LIMITS.title,'Улика'),status:typeof e.status === 'string' && Object.hasOwn(STATES,e.status)?e.status:fail('Неизвестное состояние связи.')};
  });
  return {version:1,title:str(raw.title,LIMITS.title,'Название дела'),nodes,edges};
}
export function parseGraph(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > LIMITS.bytes) fail('Файл слишком большой: максимум 8 МБ.');
  let raw; try {raw=JSON.parse(text);} catch {fail('Не удалось прочитать JSON. Исходное дело сохранено.');}
  return validateGraph(raw);
}
export const clone = graph => structuredClone(graph);
export function reachable(graph, failure = null) {
  const active = new Set(graph.nodes.filter(n=>n.status!=='unavailable' && !(failure?.kind==='node' && failure.id===n.id)).map(n=>n.id));
  const adjacency = new Map();
  for(const e of graph.edges) if(e.status!=='unavailable' && !(failure?.kind==='edge' && failure.id===e.id) && active.has(e.from) && active.has(e.to)) {
    if(!adjacency.has(e.from)) adjacency.set(e.from,[]); adjacency.get(e.from).push(e.to);
  }
  const reached = new Set(graph.nodes.filter(n=>n.start && active.has(n.id)).map(n=>n.id));
  const queue=[...reached]; for(let i=0;i<queue.length;i++) for(const to of adjacency.get(queue[i])||[]) if(!reached.has(to)){reached.add(to);queue.push(to);}
  return reached;
}
export function analyze(graph, failure=null) {
  const baseline = reachable(graph); const reached = reachable(graph,failure);
  const keys = graph.nodes.filter(n=>n.key);
  const disconnected = keys.filter(n=>!baseline.has(n.id));
  const lost = keys.filter(n=>baseline.has(n.id) && !reached.has(n.id));
  const cut = graph.edges.filter(e=>reached.has(e.from) && !reached.has(e.to)).map(e=>({edge:e, reason:e.status==='unavailable'?'Связь недоступна':failure?.kind==='edge'&&failure.id===e.id?'Улика пропущена':graph.nodes.find(n=>n.id===e.to)?.status==='unavailable'?'Карточка недоступна':failure?.kind==='node'&&failure.id===e.to?'Источник пропущен':'Путь прерван'}));
  return {baseline,reached,lost,disconnected,cut,keys};
}
export function fragileEdges(graph) { return graph.edges.filter(e=>e.status!=='unavailable' && analyze(graph,{kind:'edge',id:e.id}).lost.length>0); }
export function playerData(graph) {
  // Explicit allowlist: secrets, IDs, coordinates, hidden nodes and edge names never enter the output.
  const visible = graph.nodes.filter(n=>n.status==='found');
  const index = new Map(visible.map((n,i)=>[n.id,i+1]));
  return {title:graph.title,nodes:visible.map((n,i)=>({number:i+1,type:TYPES[n.type],title:n.title,summary:n.summary})),edges:graph.edges.filter(e=>e.status==='found' && index.has(e.from) && index.has(e.to)).map(e=>({from:index.get(e.from),to:index.get(e.to)}))};
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function playerHtml(graph) {
  const data=playerData(graph), h=escapeHtml;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>${h(data.title)} · записи игроков</title><style>body{background:#101820;color:#edf1f3;font:17px/1.65 system-ui;max-width:760px;margin:40px auto;padding:0 24px;overflow-wrap:anywhere}h1{font:2.5em Georgia,serif}article{border-top:1px solid #45525e;padding:24px 0}small{color:#bec8d1}p{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#fba59e}footer{margin:40px 0;color:#bec8d1}</style></head><body><small>КРАСНАЯ НИТЬ · ЗАПИСИ ИГРОКОВ</small><h1>${h(data.title)}</h1><p>Снимок раскрытых сведений. Нумерация относится только к этому снимку.</p>${data.nodes.map(n=>`<article id="card-${n.number}"><small>${n.number} / ${h(n.type)}</small><h2>${h(n.title)}</h2><p>${h(n.summary||'Пока без записей.')}</p></article>`).join('')}${data.edges.length?`<h2>Известные связи</h2><ul>${data.edges.map(e=>`<li><a href="#card-${e.from}">${h(data.nodes[e.from-1].title)}</a> → <a href="#card-${e.to}">${h(data.nodes[e.to-1].title)}</a></li>`).join('')}</ul>`:''}<footer>Подготовлено ведущим в «Красной нити». Названия улик и заметки ведущего в снимок не включаются.</footer></body></html>`;
}
export function createHistory(initial) {
  let current=clone(initial), past=[], future=[];
  return {get current(){return current;},get canUndo(){return past.length>0;},get canRedo(){return future.length>0;},commit(next){past.push(clone(current));if(past.length>60)past.shift();current=clone(next);future=[];},undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},redo(){if(!future.length)return false;past.push(current);current=future.pop();return true;}};
}
