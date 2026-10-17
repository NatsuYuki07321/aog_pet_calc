'use strict';
const D=window.PET_DATA,E=window.PetEngine,$=id=>document.getElementById(id);
let current=null;
const GOALS={three:{label:'三星',stars:3,threshold:2.9,countKey:'count29',passKey:'pass3',summary:'three'},five:{label:'五星',stars:5,threshold:4.9,countKey:'count49',passKey:'pass5',summary:'five'}};
const goal=()=>GOALS[$('target-star').value]||GOALS.five;
function renderGoalLabels(){const g=goal();$('calculate-button').textContent='預估'+g.label+'等級 →';$('goal-result-title').textContent=g.label+'等級預估';$('goal-rule').textContent=g.label+'條件：平均 ≥'+g.stars.toFixed(1)+'，且至少五項屬性星等 ≥'+g.threshold.toFixed(1)+'。';$('enhancement-trial-title').textContent='假設提高強化，能幾等'+g.label+'？';$('enhancement-caption').textContent='同等級強化後的八項總值與'+g.label+'比較';$('enhancement-goal-heading').textContent=g.label+'預估';$('levels-count-heading').textContent='≥'+g.threshold.toFixed(1)+'項數';$('levels-goal-heading').textContent=g.label;$('future-goal-heading').textContent=g.label+'條件';}
$('target-star').addEventListener('change',()=>{renderGoalLabels();if(current)render();});
renderGoalLabels();
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('stats').innerHTML=D.attributes.map((k,i)=>'<label>'+D.attributeLabels[i]+'總值<input id="stat-'+k+'" aria-label="'+D.attributeLabels[i]+'總值" type="number" min="0" step="1" required></label>').join('');
$('type').insertAdjacentHTML('beforeend',Object.entries(D.typeLabels).map(([id,label])=>'<option value="'+id+'">'+esc(label)+'（'+id+'）</option>').join(''));
$('example').insertAdjacentHTML('beforeend',D.examples.map((f,i)=>({f,i})).filter(({f})=>!f.equipment?.some(Boolean)).map(({f,i})=>'<option value="'+i+'">'+esc(f.name)+' / Lv.'+f.level+' +'+f.enhancement+'</option>').join(''));
function readInput(){if(D.attributes.some(k=>$('stat-'+k).value===''))throw Error('請完整輸入八項總值。');return {level:Number($('level').value),enhancement:Number($('enhancement').value),stats:D.attributes.map(k=>Number($('stat-'+k).value)),name:$('name').value.trim(),type:$('type').value};}
function calculate(){try{const input=readInput();E.check(D,input);let best,confidence=null,mean=null;if(input.type==='auto'){const fit=E.infer(D,input);best=fit.results[0];confidence=fit.confidence;mean=best.mean;}else best={candidate:{type:Number(input.type),route:D.typeLabels[input.type]},C:E.recover(D,Number(input.type),input.level,input.enhancement,input.stats)};
current={input,targetEnhancement:input.enhancement,type:best.candidate.type,route:best.candidate.route,C:best.C,confidence,mean,forecast:E.forecast(D,best.candidate.type,best.C,input.enhancement,input.level)};$('error').textContent='';$('empty').hidden=true;$('output').hidden=false;render();}catch(e){current=null;$('error').textContent=e.message;$('output').hidden=true;$('future-stats').hidden=true;$('empty').hidden=false;}}
function render(){if(!current)return;const s=current,f=s.forecast,g=goal(),pred=f[g.summary],p=E.point(D,s.type,s.C,s.input.level,s.targetEnhancement);$('route-title').textContent=s.route;$('confidence').textContent=s.confidence===null?'手動指定類型':s.confidence+'% 判斷信心';
$('five-level').textContent=pred.first===null?'本強化下，表內未達'+g.label:pred.first===s.input.level?'目前已符合'+g.label+'條件':'預估 Lv.'+pred.first+' 達'+g.label;
const ruleText='平均≥'+g.stars.toFixed(1)+'且至少五項≥'+g.threshold.toFixed(1);
$('five-note').textContent=ruleText+'。'+(pred.first===null?'本段最高只有 '+Math.max(...f.points.map(x=>x[g.countKey]))+' 項達到單項門檻。':'');
$('stable-note').textContent='表內達標區間：'+qualifiedRanges(f.points)+'。'+(pred.first!==null&&pred.stable===null?'未持續達標至查表上限；請留意升級回落。':pred.stable!==null?'從 Lv.'+pred.stable+' 起持續達標至查表上限。':'');
const averageFirst=f.points.find(x=>x.rawAverage>=g.stars)?.level??null;$('average-note').textContent='僅看平均≥'+g.stars.toFixed(1)+'：'+(averageFirst===null?'表內未達':averageFirst===s.input.level?'目前已達':'首次 Lv.'+averageFirst)+'；正式達標仍須同時符合五項門檻。';$('scope').textContent='試算 +'+s.targetEnhancement+'（實際輸入 +'+s.input.enhancement+'）；檢查 Lv.'+f.start+'～'+f.max+'。超出客戶端表格不外推。';
renderEnhancement();renderFutureStats();
$('panel-note').textContent='目前原始平均 '+p.rawAverage.toFixed(1)+'；採五項門檻推算面板 '+p.panelEstimate49.toFixed(1)+'（依玩家整理規則）。';$('aptitude').textContent='平均 C%：'+(s.mean===null?'手動類型未估算路線資質':s.mean.toFixed(1)+'%')+'。C%是資質比例，與判斷信心不同。';
$('point-table').innerHTML=D.attributes.map((k,i)=>'<tr><td>'+D.attributeLabels[i]+'</td><td>'+p.total[i]+'</td><td>'+p.white[i]+'</td><td>'+p.green[i]+'</td><td>'+p.stars[i].toFixed(1)+'</td><td>'+s.C[i]+'</td></tr>').join('');const key=g.passKey;$('levels-table').innerHTML=f.points.map(x=>'<tr data-level="'+x.level+'"><td>'+x.level+'</td><td>'+x.rawAverage.toFixed(1)+'</td><td>'+x[g.countKey]+'</td><td class="'+(x[key]?'pass':'fail')+'">'+(x[key]?'達標':'未達')+'</td></tr>').join('');}
$('form').addEventListener('submit',e=>{e.preventDefault();calculate();});
$('load-example').onclick=()=>{if($('example').value==='')return;document.dispatchEvent(new Event('pet-example-loaded'));const f=D.examples[Number($('example').value)];if(f.equipment?.some(Boolean)){current=null;$('output').hidden=true;$('future-stats').hidden=true;$('empty').hidden=false;$('error').textContent='此範例含淺藍裝備加成，不帶入；請使用無裝備面板。';return;}$('level').value=f.level;$('enhancement').value=f.enhancement;$('type').value='auto';$('name').value=f.petName||'';D.attributes.forEach((k,i)=>$('stat-'+k).value=f.stats[i]);calculate();$('load-example').closest('details').open=false;};
$('clear').onclick=()=>{$('form').reset();current=null;$('output').hidden=true;$('future-stats').hidden=true;$('empty').hidden=false;$('error').textContent='';};
$('export-json').onclick=()=>{if(!current)return;const g=goal(),summary=current.forecast[g.summary],url=URL.createObjectURL(new Blob([JSON.stringify({input:current.input,targetStars:g.stars,assumedEnhancement:current.targetEnhancement,assumedCurrentStats:E.point(D,current.type,current.C,current.input.level,current.targetEnhancement).total,type:current.type,route:current.route,C:current.C,confidence:current.confidence,rule:{averageAtLeast:g.stars,minimumStatStars:g.threshold,minimumStatCount:5,source:'玩家研究規則，非官方公式'},first:summary.first,stable:summary.stable,misses:summary.misses,note:'路線信心非達標成功率；維持同形態、強化與固定C，不做表外外推'},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='pet-'+g.stars+'-star.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

$('form').addEventListener('input',()=>{current=null;$('output').hidden=true;$('future-stats').hidden=true;$('empty').hidden=false;});

function renderFutureStats(){if(!current)return;const s=current,points=s.forecast.points.filter(p=>p.level>s.input.level);$('future-stats').hidden=false;$('prediction-limit').textContent='目前 '+s.input.level+' 等、試算強化 +'+s.targetEnhancement+'；'+(points.length?'以下列出 '+points[0].level+'～'+s.forecast.max+' 等，共 '+points.length+' 個等級。':'最多可查至 '+s.forecast.max+' 等。')+' 超出成長表不做外推。';$('future-empty').hidden=points.length>0;$('future-table-wrap').hidden=!points.length;$('future-stat-table').innerHTML=points.map(p=>'<tr data-level="'+p.level+'"><th scope="row">'+p.level+'</th>'+D.attributes.map((k,i)=>'<td><strong>'+p.total[i]+'</strong><small class="future-parts">'+p.white[i]+'＋'+p.green[i]+'</small></td>').join('')+'<td>'+p.panelEstimate49.toFixed(1)+'</td><td class="'+(p[goal().passKey]?'pass':'fail')+'">'+(p[goal().passKey]?'達標':'未達')+'</td></tr>').join('');}

function setTrialEnhancement(value){
 if(!current)return;
 const h=Number(value),max=Math.min(20,Math.floor((D.maxLevel-current.input.level)/2));
 if(!Number.isInteger(h)||h<current.input.enhancement||h>max)return;
 current.targetEnhancement=h;
 current.forecast=E.forecast(D,current.type,current.C,h,current.input.level);
 render();
}
function renderEnhancement(){
 const s=current,actual=s.input.enhancement,max=Math.min(20,Math.floor((D.maxLevel-s.input.level)/2));
 $('enhancement-baseline').textContent='實際面板：Lv.'+s.input.level+' / +'+actual+'。目前顯示假設強化 +'+s.targetEnhancement+' 成功後的結果；固定 C 與路線沿用實際面板。';
 $('trial-enhancement').innerHTML=Array.from({length:max-actual+1},(_,i)=>actual+i).map(h=>'<option value="'+h+'"'+(h===s.targetEnhancement?' selected':'')+'>+'+h+(h===actual?'（實際輸入）':'（假設成功）')+'</option>').join('');
 const hs=Array.from({length:Math.min(2,max-actual)+1},(_,i)=>actual+i);
 if(!hs.includes(s.targetEnhancement))hs.push(s.targetEnhancement);
 $('enhancement-compare').innerHTML=hs.map(h=>{
  const p=E.point(D,s.type,s.C,s.input.level,h),f=E.forecast(D,s.type,s.C,h,s.input.level);
  const pred=f[goal().summary],first=pred.first===null?'表內未達':pred.first===s.input.level?'目前已達':'Lv.'+pred.first;
  const stable='達標區間：'+qualifiedRanges(f.points);
  return '<tr data-enhancement="'+h+'"><th><button type="button" data-trial-enhancement="'+h+'" aria-pressed="'+(h===s.targetEnhancement)+'">+'+h+(h===actual?'（實際）':'')+'</button></th><td>'+first+'<small class="future-parts">'+stable+'；可查至 '+f.max+' 等</small></td>'+p.total.map(v=>'<td>'+v+'</td>').join('')+'</tr>';
 }).join('');
 const p=E.point(D,s.type,s.C,s.input.level,s.targetEnhancement);
 $('trial-current-note').textContent='Lv.'+s.input.level+' / +'+s.targetEnhancement+' 預估面板 '+p.panelEstimate49.toFixed(1)+' 星；詳細白字、綠字與單項星等見下方明細。';
}
$('trial-enhancement').addEventListener('change',e=>setTrialEnhancement(e.target.value));
$('enhancement-compare').addEventListener('click',e=>{const button=e.target.closest('button[data-trial-enhancement]');if(button)setTrialEnhancement(button.dataset.trialEnhancement);});

function qualifiedRanges(points){const ranges=[];for(const p of points){if(!p[goal().passKey])continue;const last=ranges[ranges.length-1];if(last&&last[1]===p.level-1)last[1]=p.level;else ranges.push([p.level,p.level]);}return ranges.length?ranges.map(([a,b])=>a===b?String(a):a+'～'+b).join('、')+' 等':'無';}
