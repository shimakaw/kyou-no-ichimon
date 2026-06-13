/* ============================================================
   今日の一問 — 算数・数学ラダー拡張（小学→中学→高校）
   ・skills.js / topics.js の後に読み込む
   ・「数える」から「微分」まで一本道の段階的カリキュラム
   ・lv: 1=小学 2=中学 3=高校 / prereq でつまずくと前段へ遡行
   ・図は p.diaSVG（自前SVG）を優先表示（index.html 対応済み）
   ============================================================ */
(function(){
  const E=window.ENGINE; if(!E){console.error("skills.js を先に");return;}
  const R=E.R, pick=E.pick;
  const C={ink:"#eef1ff",sub:"#8b93c8",grid:"#2b3160",blue:"#3b82f6",purple:"#8b5cf6",
    green:"#16b964",amber:"#f5a300",pink:"#ec4899",bg:"#11163a",plane:"#0e1234"};

  // ---- 共通ヘルパ ----
  const sgn=n=> n>=0?`+ ${n}`:`- ${-n}`;
  const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // 選択肢：ans 以外の一意な錯乱肢を3つ（数値なら近傍で補完）
  function U(ans, cands){
    const s=String(ans); const d=[]; const base=Number(ans);
    for(const c of cands){ const cs=String(c); if(cs!==s && !d.includes(cs)) d.push(cs); }
    let k=1;
    while(d.length<3 && k<=30){
      if(!isNaN(base)){ const v=String(base+(k%2?k:-k)); if(v!==s&&!d.includes(v))d.push(v); }
      else { const v=s+"　"+"・".repeat(k); if(!d.includes(v))d.push(v); }
      k++;
    }
    return d.slice(0,3);
  }
  // ---- 図(SVG) ----
  const SV=(inner,h)=>`<svg viewBox="0 0 320 ${h||160}" width="100%" xmlns="http://www.w3.org/2000/svg" style="display:block">${inner}</svg>`;
  function fbox(expr,sub){ const L=String(expr).length, fs=L<=9?34:L<=16?27:L<=24?21:17;
    return SV(`<rect x="16" y="32" width="288" height="84" rx="14" fill="${C.bg}" stroke="${C.grid}" stroke-width="2"/>
      <text x="160" y="84" fill="${C.ink}" font-size="${fs}" text-anchor="middle" font-weight="800">${esc(expr)}</text>
      ${sub?`<text x="160" y="138" fill="${C.sub}" font-size="13" text-anchor="middle">${esc(sub)}</text>`:""}`,158); }
  function plane(inner){ const cx=160,cy=95;
    return SV(`<rect x="6" y="8" width="308" height="172" rx="10" fill="${C.plane}" stroke="${C.grid}"/>
      <line x1="14" y1="${cy}" x2="306" y2="${cy}" stroke="#b7c4e8" stroke-width="1.5"/>
      <line x1="${cx}" y1="16" x2="${cx}" y2="176" stroke="#b7c4e8" stroke-width="1.5"/>
      <text x="300" y="${cy-5}" fill="${C.sub}" font-size="11">x</text>
      <text x="${cx+6}" y="22" fill="${C.sub}" font-size="11">y</text>${inner}`,188); }
  const clampY=y=>Math.max(18,Math.min(174,y));
  function coordLine(a,b){ const cx=160,cy=95,u=13;
    const P=[-6,6].map(x=>`${cx+x*u},${clampY(cy-(a*x+b)*u)}`);
    return plane(`<polyline points="${P.join(' ')}" fill="none" stroke="${C.blue}" stroke-width="3"/>
      <circle cx="${cx}" cy="${clampY(cy-b*u)}" r="4" fill="${C.amber}"/>`); }
  function coordParab(h,k){ const cx=160,cy=95,u=13; let pts=[];
    for(let x=h-3;x<=h+3;x+=0.5){ pts.push(`${cx+x*u},${clampY(cy-((x-h)*(x-h)+k)*u)}`); }
    return plane(`<polyline points="${pts.join(' ')}" fill="none" stroke="${C.purple}" stroke-width="3"/>
      <circle cx="${cx+h*u}" cy="${clampY(cy-k*u)}" r="5" fill="${C.amber}"/>`); }
  function triRight(a,b,c){ const ox=72,oy=142, sc=Math.min(150/Math.max(a,b),150/Math.max(a,b),16);
    const A=`${ox},${oy}`,B=`${ox+b*sc},${oy}`,Cp=`${ox},${oy-a*sc}`;
    return SV(`<polygon points="${A} ${B} ${Cp}" fill="rgba(91,157,255,.15)" stroke="${C.blue}" stroke-width="2.5"/>
      <rect x="${ox}" y="${oy-12}" width="12" height="12" fill="none" stroke="${C.blue}"/>
      <text x="${ox+b*sc/2}" y="${oy+18}" fill="${C.sub}" font-size="13" text-anchor="middle">${b}</text>
      <text x="${ox-8}" y="${oy-a*sc/2}" fill="${C.sub}" font-size="13" text-anchor="end">${a}</text>
      <text x="${ox+b*sc/2+8}" y="${oy-a*sc/2-8}" fill="${C.amber}" font-size="14" font-weight="700">${c==null?'?':c}</text>`,160); }
  function rectD(w,h){ const sc=Math.min(220/w,80/h,18), W=w*sc,H=h*sc, x=(320-W)/2,y=34;
    return SV(`<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="rgba(55,224,166,.15)" stroke="${C.green}" stroke-width="2.5"/>
      <text x="160" y="${y+H+20}" fill="${C.sub}" font-size="13" text-anchor="middle">よこ ${w}</text>
      <text x="${x-8}" y="${y+H/2+4}" fill="${C.sub}" font-size="13" text-anchor="end">たて ${h}</text>`,Math.max(150,y+H+34)); }

  function add(id,def){ E.SKILLS[id]=def; }

  /* ============ 小学(lv1) 追加：小数・面積 ============ */
  add("decimal",{ name:"小数のたし算", emoji:"🔸", lv:1, prereq:"add2", field:"math",
    hint:"位をそろえるのがコツ。0.1がいくつ分か、で考えると整数のたし算と同じ。",
    gen(){ const a=R(11,98)/10, b=R(11,98)/10; const ans=Math.round((a+b)*10)/10;
      return {hook:"位をそろえて", text:`${a.toFixed(1)} + ${b.toFixed(1)} は？`,
        diaSVG:fbox(`${a.toFixed(1)} + ${b.toFixed(1)}`),
        answer:ans.toFixed(1), isText:true,
        distractors:U(ans.toFixed(1),[(ans+0.1).toFixed(1),(ans-0.1).toFixed(1),(Math.round(a+b)).toFixed(1),(ans+1).toFixed(1)]),
        explain:`位(くらい)をそろえて足すと ${ans.toFixed(1)}。0.1が何こ分か、で考えると整数と同じ。`,
        real:"お金(円)や長さ(cm)、ゲームのタイムは小数だらけ。", conn:["math","money"]}; } });

  add("area",{ name:"面積（長方形）", emoji:"⬛", lv:1, prereq:"mul1", field:"math",
    hint:"面積＝たて×よこ。図のマスを数えると“かけ算の応用”だと分かる。",
    gen(){ const w=R(3,12), h=R(2,9); const ans=w*h;
      return {hook:"たて×よこ", text:`たて${h}cm・よこ${w}cm の長方形の面積は？`,
        diaSVG:rectD(w,h), answer:ans+"cm²", isText:true,
        distractors:U(ans+"cm²",[ (w*h+w)+"cm²", (2*(w+h))+"cm²", (w+h)+"cm²" ]),
        explain:`面積＝たて×よこ＝${h}×${w}＝${ans}cm²。まわりの長さ(${2*(w+h)})と混同しないこと。`,
        real:"部屋の広さ、土地、ゲームのマップの広さ(km²)も同じ考え方。", conn:["math","geo"]}; } });

  /* ============ 中学(lv2) ============ */
  add("neg",{ name:"正負の数", emoji:"➖➕", lv:2, prereq:"sub2", field:"math",
    hint:"数直線で考える。マイナスは『左へ』。借金や氷点下のイメージ。",
    gen(){ const a=R(-9,9), b=R(1,9), minus=R(0,1); const ans=minus?a-b:a+b;
      const t=`(${a}) ${minus?'-':'+'} ${b}`;
      return {hook:"マイナスの計算", text:`${t} を計算すると？`, diaSVG:fbox(t,"数直線で左右に動くイメージ"),
        answer:String(ans), isText:true, distractors:U(ans,[ans+1,ans-1,-ans,minus?a+b:a-b]),
        explain:`${t}＝${ans}。マイナスを足す＝左へ、引く＝右へ。ゲームのHP増減と同じ。`,
        real:"気温−3℃、残高、HPの増減…負の数は日常にあふれている。", conn:["math","game"]}; } });

  add("lineq",{ name:"一次方程式", emoji:"⚖️", lv:2, prereq:"neg", field:"math",
    hint:"両辺に同じことをして x だけにする。まず数字を移項。",
    gen(){ const a=R(2,6), x=R(-6,7), b=R(-9,9); const c=a*x+b;
      const t=`${a}x ${sgn(b)} = ${c}`;
      return {hook:"x を求めよう", text:`${t}`, diaSVG:fbox(t),
        answer:`x = ${x}`, isText:true,
        distractors:U(`x = ${x}`,[`x = ${x+1}`,`x = ${x-1}`,`x = ${-x}`,`x = ${c-b}`]),
        explain:`${b} を移項して ${a}x = ${c-b}、両辺を ${a} で割って x = ${x}。`,
        real:"『あと何個で目標？』を式にして解くのが方程式。買い物や設計の基本。", conn:["math"]}; } });

  add("ratio",{ name:"比例 y=ax", emoji:"📐", lv:2, prereq:"mul1", field:"math",
    hint:"x が□倍なら y も□倍。a は1あたりの増え方。",
    gen(){ const a=R(2,6), x=R(2,9); const y=a*x;
      return {hook:"比例で求めよう", text:`y = ${a}x のとき、x=${x} なら y は？`, diaSVG:coordLine(a,0),
        answer:String(y), isText:true, distractors:U(y,[y+a,y-a,a+x,a*x+1]),
        explain:`y=${a}x に x=${x} を代入して y=${a}×${x}=${y}。グラフは原点を通る直線。`,
        real:"速さ×時間=距離、値段×個数=代金…比例は計算の主役。", conn:["math","sports"]}; } });

  add("func2",{ name:"一次関数の傾き", emoji:"📈", lv:2, prereq:"ratio", field:"math",
    hint:"y=ax+b の a が傾き(かたむき)、b が切片(y軸との交点)。",
    gen(){ let a=R(-4,5); if(a===0)a=2; const b=R(-6,6);
      return {hook:"グラフを読む", text:`y = ${a}x ${sgn(b)} の『傾き』は？`, diaSVG:coordLine(a,b),
        answer:String(a), isText:true, distractors:U(a,[b,-a,a+1,a-1]),
        explain:`y=ax+b の a が傾き。ここでは ${a}。b=${b} は切片(y軸と交わる高さ)。`,
        real:"坂の急さ、グラフの上がり方、データの変化の速さを表す。", conn:["math","science"]}; } });

  add("sqrt",{ name:"平方根（√）", emoji:"√", lv:2, prereq:"mul1", field:"math",
    hint:"√(ある数)＝2乗するとその数になる数。√(n²)=n。",
    gen(){ const n=R(2,15); const sq=n*n;
      return {hook:"2乗の逆", text:`√${sq} は いくつ？`, diaSVG:fbox(`√${sq} = ?`,`□×□ = ${sq} となる□`),
        answer:String(n), isText:true, distractors:U(n,[n+1,n-1,Math.round(sq/2),n+2]),
        explain:`${n}×${n}=${sq} だから √${sq}=${n}。√は『2乗の逆』の計算。`,
        real:"画面の対角線、地震のエネルギー、図形の長さの計算に登場。", conn:["math","science"]}; } });

  add("factor",{ name:"因数分解", emoji:"🧩", lv:2, prereq:"mul1", field:"math",
    hint:"かけて c、足して b になる2数を見つける。",
    gen(){ let p=R(1,7), q=R(1,7); if(p>q){const t=p;p=q;q=t;} const b=p+q, c=p*q;
      const t=`x² + ${b}x + ${c}`;
      return {hook:"かけてc・足してb", text:`${t} を因数分解すると？`, diaSVG:fbox(t),
        answer:`(x+${p})(x+${q})`, isText:true,
        distractors:U(`(x+${p})(x+${q})`,[`(x+${p})(x+${q+1})`,`(x+${p+1})(x+${q})`,`(x+1)(x+${c})`,`(x+${b})(x+${c})`]),
        explain:`かけて${c}・足して${b}になるのは ${p}と${q}。だから (x+${p})(x+${q})。`,
        real:"二次方程式を解く前段階。式を“部品に分解”する考え方。", conn:["math"]}; } });

  add("quad",{ name:"二次方程式", emoji:"🟰", lv:2, prereq:"factor", field:"math",
    hint:"因数分解して (x−p)(x−q)=0。各かっこ=0 が解。",
    gen(){ let p=R(1,6), q=R(1,6); if(p>q){const t=p;p=q;q=t;} const b=p+q, c=p*q;
      const t=`x² - ${b}x + ${c} = 0`;
      return {hook:"解を求めよう", text:`${t}`, diaSVG:fbox(t),
        answer:`x = ${p}, ${q}`, isText:true,
        distractors:U(`x = ${p}, ${q}`,[`x = -${p}, -${q}`,`x = ${p}, ${q+1}`,`x = ${b}, ${c}`]),
        explain:`(x-${p})(x-${q})=0 と分解。各かっこ=0 より x=${p}, ${q}。`,
        real:"ボールの軌道や面積の問題は二次方程式で解ける。", conn:["math","science"]}; } });

  add("pythagoras",{ name:"三平方の定理", emoji:"📐", lv:2, prereq:"sqrt", field:"math",
    hint:"直角をはさむ2辺の2乗の和＝斜辺の2乗。a²+b²=c²。",
    gen(){ const tri=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[20,21,29]]);
      const a=tri[0],b=tri[1],c=tri[2];
      return {hook:"a²+b²=c²", text:`直角三角形の直角をはさむ2辺が ${a} と ${b}。斜辺は？`, diaSVG:triRight(a,b,null),
        answer:String(c), isText:true, distractors:U(c,[a+b,c+1,c-1,Math.round((a+b)/1.4)]),
        explain:`${a}²+${b}²=${a*a}+${b*b}=${c*c}=${c}²。だから斜辺は ${c}。`,
        real:"地図上の最短距離、テレビの画面サイズ(対角線)もこれで出せる。", conn:["math","game"]}; } });

  add("angle",{ name:"多角形の内角", emoji:"🔺", lv:2, prereq:"mul1", field:"math",
    hint:"n角形の内角の和＝180×(n−2)。三角形に分けて数える。",
    gen(){ const n=R(3,9); const ans=180*(n-2); const name={3:"三",4:"四",5:"五",6:"六",7:"七",8:"八",9:"九"}[n];
      return {hook:"三角形に分けて", text:`${name}角形の内角の和は？`, diaSVG:fbox(`180 × (${n} - 2)`),
        answer:ans+"°", isText:true, distractors:U(ans+"°",[(ans+180)+"°",(ans-180)+"°",(180*n)+"°"]),
        explain:`n角形は三角形(180°)が (n-2)個分。180×(${n}-2)=${ans}°。`,
        real:"製図・建築・ゲームの当たり判定など図形のいたる所で使う。", conn:["math","tech"]}; } });

  add("prob",{ name:"確率", emoji:"🎲", lv:2, prereq:"fraction", field:"math",
    hint:"確率＝(あてはまる場合の数)÷(全部の場合の数)。",
    gen(){ const it=pick([
      {q:"1個のサイコロで 6 の目が出る確率は？",a:"1/6",d:["1/2","1/3","1/12"]},
      {q:"1個のサイコロで 偶数 が出る確率は？",a:"1/2",d:["1/3","1/6","2/3"]},
      {q:"1個のサイコロで 3以上 が出る確率は？",a:"2/3",d:["1/2","1/3","1/6"]},
      {q:"コインを1回投げて 表 が出る確率は？",a:"1/2",d:["1/4","1/3","1"]},
      {q:"トランプ52枚から1枚ひく。ハートの確率は？",a:"1/4",d:["1/13","1/2","1/52"]},
    ]);
      return {hook:"場合の数で考える", text:it.q, diaSVG:fbox("確率 = あてはまる ÷ ぜんぶ"),
        answer:it.a, isText:true, distractors:it.d,
        explain:`確率＝(あてはまる場合)÷(全部)。答えは ${it.a}。ガチャやドロップ率と同じ考え方。`,
        real:"天気予報・くじ・ゲームのガチャ…確率が読めると損得が分かる。", conn:["math","game"]}; } });

  /* ============ 高校(lv3) ============ */
  add("quadfunc",{ name:"二次関数の頂点", emoji:"⛰️", lv:3, prereq:"func2", field:"math",
    hint:"y=(x−h)²+k の頂点は (h, k)。グラフの折り返し点。",
    gen(){ const h=R(-3,3), k=R(-4,4);
      const hs = h===0?"x" : (h>0?`x - ${h}`:`x + ${-h}`);
      return {hook:"放物線の折り返し点", text:`y = (${hs})² ${sgn(k)} の頂点は？`, diaSVG:coordParab(h,k),
        answer:`(${h}, ${k})`, isText:true,
        distractors:U(`(${h}, ${k})`,[`(${-h}, ${k})`,`(${h}, ${-k})`,`(${k}, ${h})`]),
        explain:`y=(x-h)²+k の頂点は (h,k)=(${h}, ${k})。グラフの一番下(または上)の点。`,
        real:"ボールやジャンプの軌道、橋のアーチの形は放物線。", conn:["math","science","game"]}; } });

  add("trig",{ name:"三角比", emoji:"📐", lv:3, prereq:"pythagoras", field:"math",
    hint:"直角三角形の辺の比。特別角(30,45,60°)の値は暗記が近道。",
    gen(){ const it=pick([
      {q:"sin30° は？",a:"1/2"},{q:"cos60° は？",a:"1/2"},
      {q:"sin60° は？",a:"√3/2"},{q:"cos30° は？",a:"√3/2"},
      {q:"sin45° は？",a:"√2/2"},{q:"cos45° は？",a:"√2/2"},
      {q:"tan45° は？",a:"1"},{q:"tan60° は？",a:"√3"},{q:"tan30° は？",a:"1/√3"},
    ]);
      const all=["1/2","√3/2","√2/2","1","√3","1/√3"]; const d=all.filter(x=>x!==it.a);
      return {hook:"特別角の値", text:it.q, diaSVG:triRight(1,Math.sqrt(3),2),
        answer:it.a, isText:true, distractors:U(it.a,d),
        explain:`三角比は直角三角形の辺の比。${it.q.replace('は？','')} ＝ ${it.a}(特別角の基本値)。`,
        real:"建物の高さ測定、ゲームの3D描画、波や音の解析に必須。", conn:["math","tech","game"]}; } });

  add("explog",{ name:"指数・対数", emoji:"🔢", lv:3, prereq:"sqrt", field:"math",
    hint:"指数=同じ数を何回かける。a^m×a^n=a^(m+n)。対数は指数の逆。",
    gen(){ const type=R(0,2);
      if(type===0){ const a=R(2,5), n=R(2,4); const v=Math.pow(a,n);
        return {hook:"何乗？", text:`${a}^${n} は いくつ？`, diaSVG:fbox(`${a}^${n} = ${a}×…×${a}`,`${a}を${n}回かける`),
          answer:String(v), isText:true, distractors:U(v,[a*n,Math.pow(a,n-1),v+a,v-1]),
          explain:`${a}を${n}回かけて ${v}。指数はゲームのEXPや細胞分裂の“急増”を表す。`,
          real:"データ量(GB)、複利、ウイルスの拡大も指数で増える。", conn:["math","tech"]}; }
      if(type===1){ const p=R(1,4), q=R(1,4);
        return {hook:"指数法則", text:`2^${p} × 2^${q} = 2^□ の □ は？`, diaSVG:fbox(`2^${p} × 2^${q} = 2^□`),
          answer:String(p+q), isText:true, distractors:U(p+q,[p*q,p+q+1,Math.abs(p-q)]),
          explain:`同じ底のかけ算は指数を足す：2^${p}×2^${q}=2^(${p}+${q})=2^${p+q}。`,
          real:"大きな数の計算を一気に簡単にする道具。", conn:["math","tech"]}; }
      const b=pick([2,3,5,10]); const n=R(1,3); const v=Math.pow(b,n);
      return {hook:"対数＝指数の逆", text:`log${b} ${v} は いくつ？（${b}を何乗すると${v}？）`, diaSVG:fbox(`${b}^□ = ${v}`),
        answer:String(n), isText:true, distractors:U(n,[v,n+1,b]),
        explain:`${b}を${n}乗すると${v}。だから log${b}${v}=${n}。対数は『何乗したか』を答える。`,
        real:"音の大きさ(dB)や地震(マグニチュード)は対数の目盛り。", conn:["math","science"]}; } });

  add("seq",{ name:"数列", emoji:"🔗", lv:3, prereq:"lineq", field:"math",
    hint:"等差は『毎回+d』、等比は『毎回×r』。第n項の公式を使う。",
    gen(){ const kind=R(0,1);
      if(kind===0){ const a=R(1,9), d=R(2,5), n=R(4,8); const v=a+(n-1)*d;
        return {hook:"等差数列", text:`初項${a}・公差${d} の等差数列。第${n}項は？`,
          diaSVG:fbox(`${a}, ${a+d}, ${a+2*d}, …`,`毎回 +${d}`),
          answer:String(v), isText:true, distractors:U(v,[a+n*d,v-d,v+d,a*n]),
          explain:`第n項＝初項+(n-1)×公差＝${a}+(${n}-1)×${d}=${v}。`,
          real:"貯金を毎月一定額ふやす、座席の数の規則…等差はパターン読みの基本。", conn:["math","money"]}; }
      const a=R(1,4), r=R(2,3), n=R(3,5); const v=a*Math.pow(r,n-1);
      return {hook:"等比数列", text:`初項${a}・公比${r} の等比数列。第${n}項は？`,
        diaSVG:fbox(`${a}, ${a*r}, ${a*r*r}, …`,`毎回 ×${r}`),
        answer:String(v), isText:true, distractors:U(v,[a*r*n,v/r,v*r,a+r*n]),
        explain:`第n項＝初項×公比^(n-1)＝${a}×${r}^${n-1}=${v}。指数的に増える数列。`,
        real:"複利、ねずみ算、画面の解像度…倍々で増えるものはこれ。", conn:["math","money"]}; } });

  add("comb",{ name:"場合の数・組合せ", emoji:"🎯", lv:3, prereq:"mul1", field:"math",
    hint:"並べる=順列(nPr)、選ぶだけ=組合せ(nCr)。nCr=nPr÷r!。",
    gen(){ const n=R(4,6), r=R(2,3);
      const fact=x=>{let f=1;for(let i=2;i<=x;i++)f*=i;return f;};
      const nPr=fact(n)/fact(n-r); const nCr=nPr/fact(r);
      return {hook:"選び方は何通り？", text:`${n}人から${r}人を選ぶ組合せ（${n}C${r}）は？`,
        diaSVG:fbox(`${n}C${r} = ${n}P${r} ÷ ${r}!`),
        answer:String(nCr), isText:true, distractors:U(nCr,[nPr,n*r,nCr+1,n+r]),
        explain:`${n}C${r}＝${n}P${r}÷${r}!＝${nPr}÷${fact(r)}＝${nCr}。順番を区別しない選び方。`,
        real:"くじの当たりやすさ、デッキの組み方、ガチャの確率計算の土台。", conn:["math","game"]}; } });

  add("diff",{ name:"微分（入口）", emoji:"📉", lv:3, prereq:"quadfunc", field:"math",
    hint:"x^n を微分すると n·x^(n−1)。傾きを式で出す道具。",
    gen(){ const a=R(1,4);
      return {hook:"傾きを式にする", text:`y = ${a}x² を微分すると（導関数 y' は）？`,
        diaSVG:fbox(`y = ${a}x²  →  y' = ?`,`x² の微分は 2x`),
        answer:`${2*a}x`, isText:true,
        distractors:U(`${2*a}x`,[`${a}x`,`${2*a}x²`,`${a*a}x`,`${2*a}`]),
        explain:`x²を微分すると2x。係数はそのまま掛けて y'=${2*a}x。微分は“その瞬間の傾き”を出す道具。`,
        real:"速度(位置の変化率)、最速・最短の設計、AIの学習も微分で動く。", conn:["math","tech","science"]}; } });

  /* ============ 既存の小学スキルに lv=1 を付与 ============ */
  ["count","add1","sub1","add2","sub2","mul1","div1","fraction","percent","average","time","money"]
    .forEach(id=>{ if(E.SKILLS[id]) E.SKILLS[id].lv=1; });

  /* ============ ラダー（数える→…→微分）と難易度帯 ============ */
  E.BAND_ORDER.all = [
    // 小学(lv1)
    "count","add1","sub1","add2","sub2","mul1","div1","fraction","decimal","percent","average","area","time","money",
    // 中学(lv2)
    "neg","lineq","ratio","func2","sqrt","factor","quad","pythagoras","angle","prob",
    // 高校(lv3)
    "quadfunc","trig","explog","seq","comb","diff",
  ];
  // レベル選択 → 算数ラダーの開始/上限（index.html が mathRange を使用）
  E.MATH_RANGE = { all:{start:1,max:3}, e:{start:1,max:1}, m:{start:2,max:2}, h:{start:3,max:3} };
  E.LADDER_LABEL = {1:"小学",2:"中学",3:"高校"};

  // 算数カテゴリ名を「算数・数学」に
  if(E.CATEGORIES.math) E.CATEGORIES.math={name:"算数・数学",emoji:"🔢"};

  // 各段の「学年」ラベル（バナー表示用）
  E.MATH_GRADE = {
    count:"小1", add1:"小1", sub1:"小1", time:"小1",
    add2:"小2", sub2:"小2", mul1:"小2", money:"小2",
    div1:"小3", fraction:"小3",
    decimal:"小4", area:"小4",
    percent:"小5", average:"小5",
    neg:"中1", lineq:"中1", ratio:"中1",
    angle:"中2", func2:"中2", prob:"中2",
    sqrt:"中3", factor:"中3", quad:"中3", pythagoras:"中3",
    quadfunc:"高1", trig:"高1", comb:"高1",
    explog:"高2", seq:"高2",
    diff:"高3",
  };
})();
