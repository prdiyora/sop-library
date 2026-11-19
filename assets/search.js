
let IDX=null;
const B=window.BASE||'';
fetch(B+'/assets/search-index.json').then(r=>r.json()).then(d=>IDX=d);
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 3;const m=a.length,n=b.length;const dp=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);for(let j=1;j<=n;j++)dp[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return dp[m][n]}
function fuzzy(qword, text){
 if(text.includes(qword))return true;
 if(qword.length<5)return false;
 const words=text.split(/[^a-z0-9]+/);
 return words.some(w=>w.length>=4&&Math.abs(w.length-qword.length)<=2&&lev(qword,w)<=2);
}
document.getElementById('sq').addEventListener('input',e=>{
 const q=e.target.value.toLowerCase().trim();const box=document.getElementById('sres');
 if(q.length<2||!IDX){box.innerHTML='';return}
 const words=q.split(/\s+/);
 const scored=IDX.map(it=>{
   let score=0;
   for(const w of words){
     if(it.t.toLowerCase().includes(w))score+=5;
     else if(it.x.includes(w))score+=2;
     else if(fuzzy(w,it.x))score+=1;
     else return [it,-1];
   }
   return [it,score];
 }).filter(p=>p[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,25);
 box.innerHTML=scored.map(([it])=>`<a class="result" href="${B+it.u}"><span class="r-id">${it.e} ${it.id}</span> <b>${it.t}</b><div class="r-snip">${it.x.slice(0,140)}…</div></a>`).join('')||'<p style="color:var(--muted)">Kai nathi malu — bija shabdo try karo.</p>';
});
