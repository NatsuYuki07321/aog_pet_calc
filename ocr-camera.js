/* Camera-photo OCR: average downsampling and agreement across glyph/OCR variants.
   Uses only visible total-value pixels, never pet growth data or number lookups. */
(function(root){'use strict';
function shrink(image,factor){
 if(factor===1)return image;
 const width=Math.floor(image.width/factor),height=Math.floor(image.height/factor),data=new Uint8ClampedArray(width*height*4),n=factor*factor;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let r=0,g=0,b=0;
  for(let dy=0;dy<factor;dy++)for(let dx=0;dx<factor;dx++){const i=((y*factor+dy)*image.width+x*factor+dx)*4;r+=image.data[i];g+=image.data[i+1];b+=image.data[i+2];}
  const i=(y*width+x)*4;data[i]=Math.round(r/n);data[i+1]=Math.round(g/n);data[i+2]=Math.round(b/n);data[i+3]=255;
 }
 return {width,height,data};
}
function variants(image,core,totals,model){
 const base=Math.max(2,Math.ceil(image.width/640)),out=[];
 for(const factor of [base,base+1]){
  try{const pixels=shrink(image,factor),prepared=core.prepare(pixels);if(prepared.step<9)continue;const read=totals.read(pixels,prepared,core,model);out.push({factor,pixels,prepared,read});}catch(e){/* Another scale may retain clearer row separation. */}
 }
 if(!out.length)throw Error('拍照面板仍無法定位八項總值，請裁切完整屬性區或手動輸入。');
 return out;
}
function review(versions,readings){
 return Array.from({length:8},(_,i)=>{
  const votes=new Map();
  function entry(value){if(!Number.isSafeInteger(value)||value<0||value>999999)return null;if(!votes.has(value))votes.set(value,{value,templates:new Set(),ocr:new Set()});return votes.get(value);}
  for(const v of versions){const e=entry(v.read[i]?.value);if(e)e.templates.add(v.factor);}
  for(const r of readings){const text=String(r.lines[i]?.text||'').replace(/\s/g,''),e=/^\d{2,6}$/.test(text)?entry(Number(text)):null;if(e)e.ocr.add(r.factor+':'+r.threshold);}
  const ranked=[...votes.values()].sort((a,b)=>(b.templates.size+b.ocr.size)-(a.templates.size+a.ocr.size));
  const agreed=ranked.filter(v=>v.templates.size&&v.ocr.size),value=agreed.length===1?agreed[0].value:null;
  return {value,uncertain:true,candidates:ranked.slice(0,5).map(v=>v.value),note:value===null?'拍照交叉辨識未能確認，請看原圖填入；候選值可能有誤。':'字形與多版本 OCR 有一致讀值；拍照仍請逐項核對。'};
 });
}
const api={shrink,variants,review};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PetCameraOCR=api;
})(typeof window==='undefined'?globalThis:window);
