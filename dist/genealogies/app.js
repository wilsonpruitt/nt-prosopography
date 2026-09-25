const BASE=document.body.dataset.base||'';
const P=D.P, R=D.R;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// membership
const inM=new Set(D.MLINE.filter(x=>x!=='omitted')), inL=new Set(D.LSEQ);
['tamar','rahab','ruth','bathsheba','mary','zerah','uriah'].forEach(x=>inM.add(x));
function cls(id){ if(id==='omitted')return 'o'; const m=inM.has(id), l=inL.has(id); return m&&l?'b':m?'m':l?'l':'x'; }

// ---------- chart ----------
const ROWS=[...D.LSEQ].reverse(); // god .. jesus
const rowOf={}; ROWS.forEach((id,i)=>rowOf[id]=i);
const shared=new Set(D.MLINE.filter(id=>inL.has(id)));
// Matthew rows: anchors are shared nodes
const mRow={};
(function(){
  let lastA=null, pend=[];
  D.MLINE.forEach(id=>{
    if(shared.has(id)){
      if(lastA!==null&&pend.length){const a=rowOf[lastA], b=rowOf[id]; pend.forEach((p,i)=>mRow[p]=a+(i+1)*(b-a)/(pend.length+1));}
      mRow[id]=rowOf[id]; lastA=id; pend=[];
    } else pend.push(id);
  });
})();
// critical-text count from Adam
const crit={};
(function(){ let n=0; [...D.LSEQ].reverse().slice(1).forEach(id=>{ n++; if(id==='ram'){crit[id]='27–28'; n++;} else crit[id]=n; }); })();

function drawChart(){
  const el=$('#chart'); if(!el) return; const W=el.clientWidth; const narrow=W<560;
  const RH=narrow?28:30, top=26;
  const X={w:narrow?14:30, m:W*(narrow?0.37:0.29), c:W*0.5, l:W*0.71, side:W*(narrow?0.31:0.29)};
  document.querySelectorAll('.lanes > div').forEach((d,i)=>d.style.left=[X.m,X.c,X.l][i]+'px');
  const H=top+(ROWS.length-1)*RH+30; el.style.height=H+'px';
  const y=r=>top+r*RH;
  const pos={};
  ROWS.forEach(id=>{ pos[id]={x: shared.has(id)?X.c:X.l, y:y(rowOf[id])}; });
  D.MLINE.forEach(id=>{ if(!shared.has(id)) pos[id]={x:X.m,y:y(mRow[id])}; });
  let html='';
  const node=(id,x,yy,c,label)=>`<button class="node ${c}" style="left:${x}px;top:${yy}px" data-id="${id}" aria-label="${esc(P[id].name)}">${esc(label||P[id].name)}</button>`;
  ROWS.forEach(id=>{ const c=cls(id)+(id==='jesus'||id==='god'?' end':''); html+=node(id,pos[id].x,pos[id].y,c); });
  D.MLINE.forEach(id=>{ if(shared.has(id))return; if(id==='omitted') html+=node(id,pos[id].x,pos[id].y,'o','3 kings omitted'); else html+=node(id,pos[id].x,pos[id].y,'m'); });
  // women and side figures
  const women=[['tamar','perez'],['rahab','boaz'],['ruth','obed'],['bathsheba','solomon'],['mary','jesus']];
  women.forEach(([w,c])=>{ html+=`<button class="node w" style="left:${X.w}px;top:${pos[c].y}px" data-id="${w}">${w==='bathsheba'?'Uriah’s wife':esc(P[w].name)}</button>`; });
  html+=`<button class="node m side" style="left:${X.side}px;top:${pos.perez.y}px" data-id="zerah">Zerah</button>`;
  // sevens
  Object.entries(crit).forEach(([id,n])=>{ const seven=(typeof n==='number'&&n%7===0); const x=pos[id].x+ (shared.has(id)?(narrow?42:52):(narrow?38:48)); html+=`<span class="num${seven?' seven':''}" style="left:${x}px;top:${pos[id].y}px">${n}</span>`; });
  // notes
  html+=`<div class="margin-note" style="left:${X.m}px;top:${y(rowOf.abraham)-RH*1.2}px">Matthew<br>begins here ↓</div>`;
  // svg
  const path=(ids,dx,P2)=>{ let d=''; ids.forEach((id,i)=>{ const p=P2[id]; const x=p.x+dx; if(i===0){d+=`M${x} ${p.y}`;return;} const q=P2[ids[i-1]]; const qx=q.x+dx; const my=(q.y+p.y)/2; d+=` C${qx} ${my} ${x} ${my} ${x} ${p.y}`; }); return d; };
  const lIds=ROWS; const mIds=D.MLINE;
  let svg=`<svg width="${W}" height="${H}" aria-hidden="true">`;
  svg+=`<path d="${path(lIds,2.5,pos)}" fill="none" stroke="var(--madder)" stroke-width="1.8"/>`;
  svg+=`<path d="${path(mIds,-2.5,pos)}" fill="none" stroke="var(--lapis)" stroke-width="1.8"/>`;
  women.forEach(([w,c])=>{ const p=pos[c]; svg+=`<path d="M${X.w+ (narrow?60:84)} ${p.y} L${p.x-(shared.has(c)?38:30)} ${p.y}" stroke="var(--lapis)" stroke-dasharray="2 3" stroke-width="1"/>`; });
  // fourteens brackets
  const secs=[['abraham','david','14'],['solomon','jechoniah','14'],['jechoniah','jesus','14']];
  secs.forEach(([a,b],i)=>{ const y1=pos[a].y-8+(i===2?RH*0.35:0), y2=pos[b].y+8-(i===1?RH*0.35:0); svg+=`<path d="M6 ${y1} L2 ${y1} L2 ${y2} L6 ${y2}" fill="none" stroke="var(--lapis)" stroke-width="1"/>`; });
  svg+='</svg>';
  secs.forEach(([a,b],i)=>{ const y1=pos[a].y, y2=pos[b].y; });
  el.innerHTML=svg+html;
  if(current) el.querySelectorAll(`[data-id="${current}"]`).forEach(n=>n.classList.add('sel'));
}
if($('#sevens')){ const sv=()=>{ $('#chart').classList.toggle('sevens',$('#sevens').checked); $('#sevens-note').hidden=!$('#sevens').checked; }; $('#sevens').addEventListener('change',sv); sv(); }

// ---------- texts ----------
function renderText(arr,ch,target){
  $(target).innerHTML=arr.map(([v,toks])=>`<p><span class="vn">${v}</span>`+toks.map(t=>Array.isArray(t)?`<button class="nm" data-id="${t[1]}">${esc(t[0])}</button>`:esc(t)).join('')+'</p>').join('');
}
if($('#mt')){ renderText(D.MATT,1,'#mt'); renderText(D.LUKE,3,'#lt'); }
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  $('#tm').hidden=b.dataset.t!=='m'; $('#tl').hidden=b.dataset.t!=='l';
}));
function tabsInit(){ if(!$('#tm')) return; const n=matchMedia('(max-width:760px)').matches; if(!n){$('#tm').hidden=false;$('#tl').hidden=false;} else { const t=document.querySelector('.tabs button[aria-pressed="true"]').dataset.t; $('#tm').hidden=t!=='m'; $('#tl').hidden=t!=='l'; } }

// ---------- chips, refs ----------
const chip=id=>`<button class="chip" data-id="${id}">${esc(P[id].name)}</button>`;
function refBlock(r){ const x=R[r]; return `<div class="ref"><div class="lab"><span>${esc(x.l)}</span><a href="${x.u}" target="_blank" rel="noopener">WEB chapter</a></div>`+x.v.map(([c,v,t])=>`<p>${x.multi?`<span class="vn">${c}:${v}</span>`:`<span class="vn">${v}</span>`}${esc(t)}</p>`).join('')+(x.t?`<p class="small">Passage continues; open the chapter to read on.</p>`:'')+`</div>`; }

if($('#extra')) $('#extra').addEventListener('click',e=>{ const b=e.target.closest('.xref'); if(!b)return; const o=$('#extra-open'); o.innerHTML=o.dataset.r===b.dataset.ref?'':refBlock(b.dataset.ref); o.dataset.r=o.innerHTML?b.dataset.ref:''; });

// index
const ORDER=[...new Set([...ROWS, ...D.MLINE, 'tamar','rahab','ruth','bathsheba','mary','zerah','uriah','sarah','rebekah','leah'])];
function renderIdx(q){ q=(q||'').toLowerCase().trim();
  $('#ix').innerHTML=ORDER.filter(id=>!q||(P[id].name+' '+(P[id].alt||'')).toLowerCase().includes(q)).map(id=>{ const c=cls(id); const where=[D.mpos[id]?`Mt 1:${D.mpos[id]}`:'',D.lpos[id]?`Lk 3:${D.lpos[id]}`:''].filter(Boolean).join(', '); return `<button class="${c}" data-id="${id}">${esc(P[id].name)}<span>${where}</span></button>`; }).join('') || '<p class="small">No name matches. Try a spelling from another translation, such as Enosh or Salathiel.</p>'; }
if($('#ix')){ $('#q').addEventListener('input',e=>renderIdx(e.target.value)); renderIdx(''); }

// ---------- drawer ----------
let current=null, lastFocus=null;
function mGen(id){ const i=D.MLINE.filter(x=>x!=='omitted').indexOf(id); return i>=0?i+1:null; }
function lGen(id){ const i=D.LSEQ.indexOf(id); return i>0?i:null; }
function openP(id,push=true){
  const p=P[id]; if(!p)return; current=id; lastFocus=lastFocus||document.activeElement;
  $('#dname').textContent=p.name; $('#dalt').textContent=p.alt?('Also '+p.alt):''; $('#drole').textContent=p.role||'';
  let h='';
  const pl=[];
  if(D.mpos[id]) pl.push(`<span class="m">Matthew 1:${D.mpos[id]}${mGen(id)?` · ${mGen(id)} from Abraham`:''}</span>`);
  if(D.lpos[id]) pl.push(`<span class="l">Luke 3:${D.lpos[id]}${lGen(id)?` · ${lGen(id)} above Jesus`:''}</span>`);
  if(id==='omitted') pl.push(`<span class="m">Between Matthew 1:8 and 1:9</span>`);
  if(crit[id]) pl.push(`<span class="l">${crit[id]} from Adam (critical text)</span>`);
  if(pl.length) h+=`<div class="place">${pl.join('')}</div>`;
  h+=`<p>${esc(p.sum)}</p>`;
  if(p.rel&&p.rel.length){ h+=`<h4>Connected</h4><dl class="rel">`+p.rel.map(([lab,rid,txt])=>`<dt>${esc(lab||'')}</dt><dd>${rid?`<button class="link" data-id="${rid}">${esc(P[rid].name)}</button>`:esc(txt)}</dd>`).join('')+`</dl>`; }
  if(p.note) h+=`<h4>Note</h4><div class="note">${esc(p.note)}</div>`;
  if(p.key&&p.key.length) h+=`<h4>In the Bible</h4>`+p.key.map(refBlock).join('');
  if(p.also&&p.also.length) h+=`<h4>Also named in</h4><div class="refs">${p.also.map(r=>`<button class="chip dref" data-ref="${r}">${esc(R[r].l)}</button>`).join('')}</div><div id="dref-open" class="open-ref"></div>`;
  if(p.rec&&p.rec.length) h+=`<h4>Tradition and reception</h4><div class="rec">`+p.rec.map(([t,x])=>`<p><b>${esc(t)}</b>${esc(x)}</p>`).join('')+`</div>`;
  if(p.hugo||['boaz','ruth','abraham','david','uriah','omitted','jacob'].includes(id)) h+=`<p class="small" style="margin-top:18px"><a href="${BASE}q/the-carnal-line/#peguy">Read Péguy on the genealogies</a></p>`;
  $('#dbody').innerHTML=h; $('#dbody').scrollTop=0;
  document.body.classList.add('open'); $('#drawer').setAttribute('aria-hidden','false');
  document.querySelectorAll('.node.sel').forEach(n=>n.classList.remove('sel'));
  document.querySelectorAll(`#chart [data-id="${id}"]`).forEach(n=>n.classList.add('sel'));
  $('#close').focus({preventScroll:true});
  if(push) history.replaceState(null,'','#/p/'+id);
}
function closeP(){ document.body.classList.remove('open'); $('#drawer').setAttribute('aria-hidden','true'); current=null; document.querySelectorAll('.node.sel').forEach(n=>n.classList.remove('sel')); if(location.hash.startsWith('#/p/')) history.replaceState(null,'',location.pathname+location.search); if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true}); lastFocus=null; }
document.addEventListener('click',e=>{
  const d=e.target.closest('.dref'); if(d){ const o=$('#dref-open'); const same=o.dataset.r===d.dataset.ref; o.innerHTML=same?'':refBlock(d.dataset.ref); o.dataset.r=same?'':d.dataset.ref; return; }
  if(e.target.closest('[data-close]')){ closeP(); return; }
  const b=e.target.closest('[data-id]'); if(b){ e.preventDefault(); if(!current) lastFocus=b; openP(b.dataset.id); }
});
$('#close').addEventListener('click',closeP); $('#scrim').addEventListener('click',closeP);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&current) closeP(); });

function fromHash(){ const m=location.hash.match(/^#\/p\/(\w+)/); if(m&&P[m[1]]) openP(m[1],false); }
let rt; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{drawChart();tabsInit();},120); });
drawChart(); tabsInit(); fromHash();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(drawChart);
