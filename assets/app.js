
const KEY='sop-express-progress-v1';
const B=window.BASE||'';
function st(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}}
function sv(s){localStorage.setItem(KEY,JSON.stringify(s))}
function markDone(id){const s=st();s.done=s.done||{};s.done[id]=!s.done[id];if(s.done[id]){if(!s.order)s.order=[];if(!s.order.includes(id))s.order.push(id)}sv(s);paint()}
function setCurrent(id){const s=st();s.current=id;sv(s);paint()}
function paint(){
 const s=st();document.querySelectorAll('[data-topic]').forEach(b=>{
  const id=b.getAttribute('data-topic');
  const d=b.querySelector('.markdone');
  if(d){const on=s.done&&s.done[id];d.classList.toggle('active',!!on);d.textContent=on?'✅ Done':'☑️ Mark done'}
  const c=b.querySelector('.setcur');
  if(c){const on=s.current===id;c.classList.toggle('active',!!on);c.textContent=on?'📍 Current stop':'📍 Set current stop'}
 });
 document.querySelectorAll('[data-done-id]').forEach(el=>{
   const id=el.getAttribute('data-done-id');if(s.done&&s.done[id])el.style.display='inline-block';});
 paintGates(s);
 if(document.getElementById('progress-root'))renderProgress(s);
 if(document.getElementById('continue-root'))renderContinue(s);
}
function renderContinue(s){
 const el=document.getElementById('continue-root');
 if(s.current&&window.TOPICS&&window.TOPICS[s.current]){
  const t=window.TOPICS[s.current];
  el.innerHTML=`<a class="btn amber" href="${B+t.url}">📍 Continue: ${t.id} ${t.title} →</a>`;
 } else el.innerHTML=`<a class="btn amber" href="${B}/journey/">🚉 Start the journey →</a>`;
}
function renderProgress(s){
 const el=document.getElementById('progress-root');if(!window.COACHES)return;
 let html='';const done=(s.done||{});
 let td=0;
 window.COACHES.forEach(c=>{
  const dn=c.topics.filter(id=>done[id]).length;td+=dn;
  const pct=Math.round(100*dn/c.topics.length);
  html+=`<a class="stop" style="min-width:210px" href="${B+c.url}"><div class="num">${c.emoji}${c.engine?'':' '+String(c.num).padStart(2,'0')}</div><div class="nm">${c.title}</div><div class="bar-bg"><div class="bar-fg" style="width:${pct}%"></div></div><div class="meta" style="font-size:12px;color:var(--muted);margin-top:6px">${dn}/${c.topics.length} stops ✅</div></a>`;
 });
 let cur='';
 if(s.current&&window.TOPICS[s.current]){const t=window.TOPICS[s.current];cur=`<div class="notice">📍 <b>Current stop:</b> <a href="${B+t.url}">${t.id} — ${t.title}</a> (Coach ${t.coach})</div>`}
 const gd=Object.values(s.gates||{}).filter(Boolean).length;
 el.innerHTML=`<h2 style="margin:10px 0">📍 My Journey — ${td} / ${Object.keys(window.TOPICS).length} stops done</h2>${cur}<p style="font-size:14.5px;margin:4px 0 10px">🚦 Gate items ticked: <b>${gd}</b> (gates full route par chhe — Journey page juo)</p><div class="track">${html}</div><p style="margin-top:14px;color:var(--muted);font-size:14px">Progress saves in this browser automatically. Koi pan topic page par "Mark done" ke "Set current stop" dabavo.</p>`;
}
function gateTick(id,el){const s=st();s.gates=s.gates||{};s.gates[id]=el.checked;sv(s);paintGates(s)}
function paintGates(s){
 document.querySelectorAll('input.check-g').forEach(el=>{el.checked=!!(s.gates&&s.gates[el.dataset.g])});
 document.querySelectorAll('[data-gate]').forEach(box=>{
  const ins=box.querySelectorAll('input.check-g');const dn=Array.from(ins).filter(i=>i.checked).length;
  const lab=box.querySelector('.gcount');if(lab&&ins.length)lab.textContent=dn+'/'+ins.length+' ✅';
 });
}

function renderTrainStrip(){
 if(!window.COACHES||!window.TOPICS)return;
 if(document.getElementById('train-strip'))return;
 const footer=document.querySelector('footer.site');if(!footer)return;
 const path=location.pathname.replace(/\/+/g,'/');
 let curId=null,curCoachNum=null;
 for(const id in window.TOPICS){const t=window.TOPICS[id];if(path.endsWith(t.url)){curId=id;curCoachNum=t.coach;break}}
 if(curCoachNum==null){const c=window.COACHES.find(c=>path.endsWith(c.url));if(c)curCoachNum=c.num}
 const order=window.COACHES;
 const idx=order.findIndex(c=>c.num===curCoachNum);
 let line='';
 if(idx>=0){
  const c=order[idx];
  const behind=order.slice(0,idx).filter(x=>!x.engine).length;
  const ahead=order.slice(idx+1).filter(x=>!x.engine).length;
  const nm=c.engine?'Engine 🚂':'Dabbo '+String(c.num).padStart(2,'0');
  if(c.engine)line='📍 Tame ahi chho: <b>Engine 🚂</b> — badha 14 dabba pachhal, aa train no end';
  else if(curId)line='📍 Tame ahi chho: <b>'+nm+'</b> · Stop '+curId+' — pachhal <b>'+behind+'</b> dabba, aagal <b>'+ahead+'</b> dabba'+(ahead===0?'':' + engine');
  else line='📍 Tame ahi chho: <b>'+nm+'</b> — pachhal <b>'+behind+'</b> dabba, aagal <b>'+ahead+'</b> dabba'+(ahead===0?'':' + engine');
 } else {
  line='🚂 Aakhi train ek nazar ma — start thi end sudhi: 13 dabba + engine';
 }
 let html='<div class="track">';
 order.forEach(c=>{
  const cur=c.num===curCoachNum;
  const num=c.engine?'🚂':c.emoji+' '+String(c.num).padStart(2,'0');
  html+='<a class="stop ts-coach'+(cur?' ts-cur':'')+'" href="'+B+c.url+'"><div class="num">'+num+'</div><div class="nm">'+c.title+'</div><div class="meta">'+c.topics.length+' stops</div>'+(cur&&curId?'<span class="ts-badge">📍 '+curId+'</span>':'')+'</a>';
 });
 html+='</div>';
 const sec=document.createElement('section');
 sec.className='trainstrip';sec.id='train-strip';
 sec.innerHTML='<div class="wrap"><div class="ts-line">'+line+'</div>'+html+'</div>';
 footer.parentNode.insertBefore(sec,footer);
 const cur=sec.querySelector('.ts-cur');
 if(cur){const track=sec.querySelector('.track');track.scrollLeft=cur.offsetLeft-track.clientWidth/2+cur.clientWidth/2}
}
document.addEventListener('DOMContentLoaded',()=>{
 const b=document.querySelector('.burger');if(b)b.onclick=()=>document.querySelector('nav.main').classList.toggle('open');
 paint();
 renderTrainStrip();
});
