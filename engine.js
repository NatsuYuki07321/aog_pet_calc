/* Offline pet growth engine. Integer star IDs avoid floating-point gate errors. */
(function(root){'use strict';
const normalize=s=>String(s||'').trim().toLowerCase().replace(/[\s·・_\-—/／,，、()（）\[\]]+/g,'').replace(/[髮擊戰靈準兇樹蟲盜蘿貓龍鳥鐵鱗藍隊員長術萬針齊療懲聖氣]/g,c=>({'髮':'发','擊':'击','戰':'战','靈':'灵','準':'准','兇':'凶','樹':'树','蟲':'虫','盜':'盗','蘿':'萝','貓':'猫','龍':'龙','鳥':'鸟','鐵':'铁','鱗':'鳞','藍':'蓝','隊':'队','員':'员','長':'长','術':'术','萬':'万','針':'针','齊':'齐','療':'疗','懲':'惩','聖':'圣','氣':'气'}[c]));
function check(data,{level,enhancement,stats,type}){
 if(!Number.isInteger(level)||level<1||level>data.maxLevel)throw Error('等級須為 1～'+data.maxLevel+' 的整數');
 if(!Number.isInteger(enhancement)||enhancement<0||enhancement>20)throw Error('強化須為 0～20 的整數');
 if(level+2*enhancement>data.maxLevel)throw Error('等級 + 2 × 強化超出成長表，不能外推');
 if(!Array.isArray(stats)||stats.length!==8||stats.some(x=>!Number.isSafeInteger(x)||x<0))throw Error('請填入八項非負整數面板總值');
 if(type!==undefined&&type!=='auto'&&!data.curves[String(type)])throw Error('找不到此成長類型');
}
function recover(data,type,level,enhancement,stats){check(data,{type,level,enhancement,stats});return stats.map((x,i)=>x-data.curves[String(type)][level+2*enhancement-1][i]);}
function point(data,type,C,level,enhancement){
 const rows=data.curves[String(type)];if(!rows||!Number.isInteger(level)||!Number.isInteger(enhancement)||level<1||enhancement<0||!rows[level-1]||!rows[level+2*enhancement-1])return null;
 if(!Array.isArray(C)||C.length!==8||C.some(x=>!Number.isFinite(x)))throw Error('固定 C 必須有八項有效數值');
 const white=rows[level-1],total=rows[level+2*enhancement-1].map((x,i)=>x+C[i]),green=total.map((x,i)=>x-white[i]);
 const ids=green.map((x,i)=>{let id=0;for(const r of data.stars)if(x>=r.values[i])id=r.id;return id;});
 const sumId=ids.reduce((a,b)=>a+b,0),count=t=>ids.filter(x=>x>=t).length;
 return {level,enhancement,total,white,green,ids,stars:ids.map(x=>x/10),sum:sumId/10,rawAverage:Math.floor(sumId/8)/10,count29:count(29),count39:count(39),count49:count(49),count50:count(50),panelEstimate49:Math.min(Math.floor(sumId/8)/10,...[3,4,5].filter(t=>count(t*10-1)<5).map(t=>t-.1)),panelEstimate50:Math.min(Math.floor(sumId/8)/10,...[3,4,5].filter(t=>count(t===5?50:t*10-1)<5).map(t=>t-.1)),pass4:sumId>=320&&count(39)>=5,passAverage5:sumId>=400,pass3:sumId>=240&&count(29)>=5,pass5:sumId>=400&&count(49)>=5,pass5Strict:sumId>=400&&count(50)>=5};
}
function summary(points,key){const first=points.find(p=>p[key])?.level??null;let lastFail=-1;points.forEach((p,i)=>{if(!p[key])lastFail=i;});return {first,stable:points[lastFail+1]?.level??null,misses:first===null?[]:points.filter(p=>p.level>=first&&!p[key]).map(p=>p.level)};}
function forecast(data,type,C,enhancement,start=55){
 if(!Number.isInteger(start)||start<1||!Number.isInteger(enhancement)||enhancement<0||enhancement>20)throw Error('預測起點或強化無效');
 const rows=data.curves[String(type)];if(!rows)throw Error('成長類型無效');
 const max=rows.length-2*enhancement,points=[];for(let lv=start;lv<=max;lv++){const p=point(data,type,C,lv,enhancement);if(p)points.push(p);}
 return {start,max,points,averageFive:summary(points,'passAverage5'),three:summary(points,'pass3'),five:summary(points,'pass5'),fiveStrict:summary(points,'pass5Strict')};
}
function infer(data,input){
 check(data,input);const {level,enhancement,stats,name='',skills='',type='auto'}=input;let cs=data.candidates;
 if(type!=='auto')cs=cs.filter(c=>c.type===Number(type));
 const n=normalize(name);let nameMatched=false;
 if(n){const aliases=data.websiteAliases.filter(x=>normalize(x.name)===n),starts=new Set(aliases.flatMap(x=>x.startPetIds));const ids=new Set(Object.entries(data.petNames).filter(([id,label])=>normalize(label)===n).map(([id])=>Number(id)));const matched=cs.filter(c=>ids.has(c.currentPetId)||starts.has(c.startPetId));if(matched.length){cs=matched;nameMatched=true;}}
 const skillTokens=skills.split(/[\s,，、/／;；·]+/).map(normalize).filter(Boolean);const skillIDs=new Set(Object.entries(data.skills).filter(([id,label])=>skillTokens.includes(normalize(label))).map(([id])=>Number(id)));
 const results=[];
 for(const c of cs){const C=recover(data,c.type,level,enhancement,stats),percentages=C.map((v,i)=>c.c0[i]>0?v/c.c0[i]*100:null),ps=percentages.filter(x=>x!==null);if(ps.length<4)continue;const mean=ps.reduce((a,b)=>a+b,0)/ps.length,sd=Math.sqrt(ps.reduce((a,b)=>a+(b-mean)**2,0)/ps.length);let penalty=0,zeroPenalty=0;
  C.forEach((v,i)=>{const scale=Math.max(c.c0[i],c.cMax[i]-c.cMin[i],20);if(v<c.cMin[i])penalty+=(c.cMin[i]-v)/scale;if(v>c.cMax[i])penalty+=(v-c.cMax[i])/scale;if(v<0)penalty+=Math.abs(v)/scale+4;if(c.c0[i]===0&&Math.abs(v)>3)zeroPenalty+=Math.abs(v)/25;});
  const skillMatch=skillIDs.size?[...skillIDs].filter(id=>c.skills.includes(id)).length/skillIDs.size:0;
  const score=sd+penalty*85+zeroPenalty*45+(mean<25?(25-mean)*2:mean>160?(mean-160)*1.5:0)-skillMatch*28;
  results.push({candidate:c,C,percentages,mean,score,penalty,skillMatch});
 }
 results.sort((a,b)=>a.score-b.score);if(!results.length)throw Error('沒有可比對的資質路線，請手動選擇成長類型');const best=results[0],alternative=results.find(r=>r.candidate.id!==best.candidate.id&&(r.candidate.route!==best.candidate.route||r.candidate.currentPetId!==best.candidate.currentPetId)),gap=alternative?alternative.score-best.score:18,confidence=Math.round(Math.max(38,Math.min(99,48+(nameMatched?28:0)+(skillIDs.size?best.skillMatch*16:0)+Math.min(12,Math.max(0,gap)*.8)-Math.min(20,best.penalty*18))));return {results:results.slice(0,8),nameMatched,confidence};
}
const api={normalize,check,recover,point,summary,forecast,infer};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PetEngine=api;
})(typeof window==='undefined'?globalThis:window);

