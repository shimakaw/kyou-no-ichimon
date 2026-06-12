/* ============================================================
   今日の一問 — スキル定義＋問題ジェネレーター＋図解生成
   ・固定問題集ではなく、毎回その場で問題を生成する
   ・答えの位置はエンジン側でシャッフル（正解は1に偏らない）
   ・各問題に図解(SVG)を自動生成
   ・prereq（前提スキル）で、間違えたら簡単な所まで戻れる
   ============================================================ */
(function(){
  const COL = {blue:"#5b9dff",green:"#5be37a",pink:"#ff7bd0",amber:"#ffd23f",
    orange:"#ff8e3c",purple:"#b388ff",teal:"#37e0a6",red:"#ff6b8a",grid:"#2b3160",ink:"#dfe3ff",sub:"#8b93c8"};

  const R = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const uniq = a => [...new Set(a)];

  /* ---------- 図解 SVG 生成 ----------
     d.type に応じて絵を返す。viewBox 320x180 を基本とする。 */
  function svg(inner, h){ return `<svg viewBox="0 0 320 ${h||180}" width="100%" xmlns="http://www.w3.org/2000/svg" style="display:block">${inner}</svg>`; }

  function diaDots(p){ // 2グループのドット（たし算）/ 1グループ＋×（ひき算）
    const r=14, gap=34, perRow=6, pad=26; let x=pad,y=40,inner="";
    const draw=(n,color,crossFrom)=>{
      for(let i=0;i<n;i++){
        const cx=x+(i%perRow)*gap, cy=y+Math.floor(i/perRow)*gap;
        inner+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${crossFrom!=null&&i>=crossFrom?0.25:0.95}"/>`;
        if(crossFrom!=null&&i>=crossFrom)
          inner+=`<line x1="${cx-r}" y1="${cy-r}" x2="${cx+r}" y2="${cy+r}" stroke="${COL.red}" stroke-width="4"/>
                  <line x1="${cx+r}" y1="${cy-r}" x2="${cx-r}" y2="${cy+r}" stroke="${COL.red}" stroke-width="4"/>`;
      }
    };
    if(p.b!=null && p.cross==null){ // たし算: a個＋b個
      draw(p.a, COL.blue);
      const rows=Math.ceil(p.a/perRow); y=40+rows*gap+10;
      inner+=`<text x="160" y="${y-gap+2}" fill="${COL.sub}" font-size="20" text-anchor="middle">＋</text>`;
      y+=4; draw(p.b, COL.amber);
      return svg(inner, y+30);
    } else { // ひき算: a個のうち後ろからb個に×
      draw(p.a, COL.blue, p.a-p.cross);
      const rows=Math.ceil(p.a/perRow);
      return svg(inner, 40+rows*gap+20);
    }
  }

  function diaNumberline(p){ // 数直線：from から +d / -d
    const x0=24,x1=296,W=x1-x0, max=p.max, y=110;
    const sx=v=>x0+(v/max)*W;
    let inner=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${COL.sub}" stroke-width="2"/>`;
    for(let v=0;v<=max;v+=p.step){ const X=sx(v);
      inner+=`<line x1="${X}" y1="${y-6}" x2="${X}" y2="${y+6}" stroke="${COL.sub}" stroke-width="2"/>
              <text x="${X}" y="${y+24}" fill="${COL.sub}" font-size="11" text-anchor="middle">${v}</text>`; }
    const A=sx(p.from), B=sx(p.to), mid=(A+B)/2, top=y-34;
    inner+=`<path d="M${A} ${y-4} Q ${mid} ${top} ${B} ${y-4}" fill="none" stroke="${p.add?COL.green:COL.orange}" stroke-width="3" marker-end="url(#ah)"/>
      <defs><marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${p.add?COL.green:COL.orange}"/></marker></defs>
      <text x="${mid}" y="${top-4}" fill="${p.add?COL.green:COL.orange}" font-size="13" text-anchor="middle" font-weight="700">${p.add?'＋':'−'}${p.amt}</text>
      <circle cx="${A}" cy="${y}" r="5" fill="${COL.blue}"/>`;
    return svg(inner,150);
  }

  function diaArray(p){ // かけ算の格子 a行 × b列
    const cell=Math.min(26, 200/Math.max(p.a,p.b)), gap=cell+4, x0=40,y0=24, r=cell/2-3;
    let inner="";
    for(let i=0;i<p.a;i++)for(let j=0;j<p.b;j++)
      inner+=`<circle cx="${x0+j*gap}" cy="${y0+i*gap}" r="${r>4?r:4}" fill="${COL.purple}"/>`;
    const h=y0+p.a*gap+10, w=x0+p.b*gap;
    inner+=`<text x="${x0-16}" y="${y0+(p.a*gap)/2}" fill="${COL.sub}" font-size="13" text-anchor="middle">${p.a}行</text>
            <text x="${x0+(p.b*gap)/2-gap/2}" y="${y0-8}" fill="${COL.sub}" font-size="13" text-anchor="middle">${p.b}列</text>`;
    return svg(inner, h<120?120:h);
  }

  function diaGroups(p){ // わり算：total個を g グループに均等配分
    const per=p.total/p.g, r=11, x0=30, gw=Math.min(120,(280)/p.g - 6), y0=30;
    let inner="";
    for(let k=0;k<p.g;k++){
      const gx=x0+k*(gw+8);
      inner+=`<rect x="${gx-6}" y="${y0-6}" width="${gw}" height="${gw}" rx="10" fill="none" stroke="${COL.grid}" stroke-width="2"/>`;
      const cols=Math.ceil(Math.sqrt(per));
      for(let i=0;i<per;i++){
        const cx=gx+8+(i%cols)*(r*1.7), cy=y0+8+Math.floor(i/cols)*(r*1.7);
        inner+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${COL.teal}"/>`;
      }
      inner+=`<text x="${gx-6+gw/2}" y="${y0+gw+14}" fill="${COL.sub}" font-size="11" text-anchor="middle">グループ${k+1}</text>`;
    }
    return svg(inner, 160);
  }

  function diaPie(p){ // 円グラフ n等分のうち k個に色
    const cx=160,cy=88,rad=66, n=p.n, k=p.k; let inner="";
    for(let i=0;i<n;i++){
      const a0=(i/n)*2*Math.PI - Math.PI/2, a1=((i+1)/n)*2*Math.PI - Math.PI/2;
      const x0=cx+rad*Math.cos(a0), y0=cy+rad*Math.sin(a0);
      const x1=cx+rad*Math.cos(a1), y1=cy+rad*Math.sin(a1);
      const large=(a1-a0)>Math.PI?1:0;
      inner+=`<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${rad} ${rad} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z"
        fill="${i<k?COL.pink:'#1b2046'}" stroke="#0f1226" stroke-width="2"/>`;
    }
    return svg(inner,176);
  }

  function diaPropbar(p){ // 割合バー：total分割のうち part個に色 ＋ 100スケール対応
    const x0=24,x1=296,W=x1-x0,y=46,h=30, seg=W/p.total;
    let inner=`<text x="24" y="30" fill="${COL.sub}" font-size="12">全体を ${p.total} に分けたうち ${p.part} 個</text>`;
    for(let i=0;i<p.total;i++)
      inner+=`<rect x="${x0+i*seg}" y="${y}" width="${seg-1.5}" height="${h}" rx="3"
        fill="${i<p.part?COL.green:'#1b2046'}" stroke="#0f1226"/>`;
    // 100スケール
    const y2=110;
    inner+=`<text x="24" y="${y2-8}" fill="${COL.sub}" font-size="12">同じ割合を「100」で見ると…</text>
      <rect x="${x0}" y="${y2}" width="${W}" height="${h}" rx="5" fill="#1b2046" stroke="${COL.grid}"/>
      <rect x="${x0}" y="${y2}" width="${(p.part/p.total)*W}" height="${h}" rx="5" fill="${COL.amber}"/>
      <text x="${x0+(p.part/p.total)*W/2}" y="${y2+20}" fill="#2a1c00" font-size="13" font-weight="800" text-anchor="middle">?%</text>`;
    return svg(inner,160);
  }

  function diaBars(p){ // 平均：複数の棒＋平均線
    const x0=44,base=130, bw=40, gap=22, maxV=Math.max(...p.vals)*1.15;
    const sh=v=>(v/maxV)*92;
    let inner=`<line x1="30" y1="${base}" x2="300" y2="${base}" stroke="${COL.sub}" stroke-width="2"/>`;
    p.vals.forEach((v,i)=>{ const x=x0+i*(bw+gap), hh=sh(v);
      inner+=`<rect x="${x}" y="${base-hh}" width="${bw}" height="${hh}" rx="5" fill="${COL.blue}"/>
              <text x="${x+bw/2}" y="${base-hh-6}" fill="${COL.ink}" font-size="13" text-anchor="middle" font-weight="700">${v}</text>
              <text x="${x+bw/2}" y="${base+16}" fill="${COL.sub}" font-size="11" text-anchor="middle">${i+1}回目</text>`;
    });
    const ay=base-sh(p.avg);
    inner+=`<line x1="34" y1="${ay}" x2="300" y2="${ay}" stroke="${COL.amber}" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="300" y="${ay-5}" fill="${COL.amber}" font-size="12" text-anchor="end" font-weight="700">平均 ?</text>`;
    return svg(inner,150);
  }

  function diaClock(p){ // 時計：h時0分
    const cx=160,cy=90,rad=72; let inner=`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#11163a" stroke="${COL.grid}" stroke-width="4"/>`;
    for(let i=1;i<=12;i++){ const a=(i/12)*2*Math.PI-Math.PI/2;
      inner+=`<text x="${cx+(rad-16)*Math.cos(a)}" y="${cy+(rad-16)*Math.sin(a)+5}" fill="${COL.ink}" font-size="14" text-anchor="middle" font-weight="700">${i}</text>`; }
    const ha=(p.h%12)/12*2*Math.PI-Math.PI/2; // 短針
    inner+=`<line x1="${cx}" y1="${cy}" x2="${cx+34*Math.cos(ha)}" y2="${cy+34*Math.sin(ha)}" stroke="${COL.orange}" stroke-width="6" stroke-linecap="round"/>`;
    const ma=-Math.PI/2; // 長針 12
    inner+=`<line x1="${cx}" y1="${cy}" x2="${cx+52*Math.cos(ma)}" y2="${cy+52*Math.sin(ma)}" stroke="${COL.blue}" stroke-width="4" stroke-linecap="round"/>
            <circle cx="${cx}" cy="${cy}" r="5" fill="${COL.amber}"/>`;
    return svg(inner,180);
  }

  function diaCoins(p){ // お金：コインを並べる
    const order=[500,100,50,10,5,1]; const colMap={500:COL.amber,100:"#c9cdd6",50:"#c9cdd6",10:COL.orange,5:COL.amber,1:"#c9cdd6"};
    let x=40,y=50,inner=""; let idx=0;
    order.forEach(v=>{ const c=p.coins[v]||0; for(let i=0;i<c;i++){
      inner+=`<circle cx="${x}" cy="${y}" r="20" fill="${colMap[v]}" stroke="#0f1226" stroke-width="2"/>
              <text x="${x}" y="${y+5}" fill="#1a1a1a" font-size="13" text-anchor="middle" font-weight="800">${v}</text>`;
      idx++; x+=48; if(x>290){x=40;y+=52;} } });
    return svg(inner, y+40);
  }

  function diaEmoji(p){ // 大きな絵文字（国旗・動物など）／サブ文字つき
    const sub = p.sub? `<text x="160" y="150" fill="${COL.sub}" font-size="14" text-anchor="middle">${p.sub}</text>`:"";
    return svg(`<text x="160" y="105" font-size="86" text-anchor="middle">${p.char}</text>${sub}`,170);
  }
  function diaWord(p){ // 大きな文字（漢字・ことば）
    const fs = p.word.length<=2?72 : p.word.length<=4?52:38;
    const sub = p.sub? `<text x="160" y="150" fill="${COL.sub}" font-size="14" text-anchor="middle">${p.sub}</text>`:"";
    return svg(`<rect x="70" y="22" width="180" height="100" rx="14" fill="#11163a" stroke="${COL.grid}" stroke-width="2"/>
      <text x="160" y="92" fill="${COL.ink}" font-size="${fs}" text-anchor="middle" font-weight="800">${p.word}</text>${sub}`,170);
  }
  function renderDia(d){
    if(!d) return "";
    switch(d.type){
      case"dots":return diaDots(d); case"numberline":return diaNumberline(d);
      case"array":return diaArray(d); case"groups":return diaGroups(d);
      case"pie":return diaPie(d); case"propbar":return diaPropbar(d);
      case"bars":return diaBars(d); case"clock":return diaClock(d);
      case"coins":return diaCoins(d); case"emoji":return diaEmoji(d);
      case"word":return diaWord(d); default:return "";
    }
  }

  /* ---------- スキル定義（ジェネレーター付き） ----------
     gen() は {text, dia, answer, distractors, unit, hook} を返す。
     answer は「値」。エンジンが answer＋distractors をシャッフルして選択肢にする。 */
  const SKILLS = {
    count:{ name:"かずをかぞえる", emoji:"🔢", band:"low", field:"math", prereq:null,
      hint:"数えるのが基礎の基礎。指を使ってOK。『いっしょに数えてみよう』と隣で声を合わせるのが効果的です。",
      gen(){ const n=R(3,9);
        return {hook:"○をかぞえてみよう", text:`青い○は ぜんぶで 何こ？`,
          dia:{type:"dots",a:n,b:null,cross:null},
          answer:n, distractors:[n-1,n+1,n+2], unit:"こ"}; } },

    add1:{ name:"たし算（1けた）", emoji:"➕", band:"low", field:"math", prereq:"count",
      hint:"くり上がりの前段階。図のドットを『合わせると何個？』と一緒に数えると“たし算＝合わせる”が体で分かります。",
      gen(){ const a=R(1,5),b=R(1,9-a>0?9-a:1); const bb=Math.min(b,9-a);
        return {hook:"合わせると何こ？", text:`青○が ${a}こ、黄○が ${bb}こ。あわせて 何こ？`,
          dia:{type:"dots",a:a,b:bb,cross:null}, answer:a+bb, distractors:[a+bb-1,a+bb+1,a+bb+2], unit:"こ"}; } },

    sub1:{ name:"ひき算（1けた）", emoji:"➖", band:"low", field:"math", prereq:"add1",
      hint:"×印で消えた数を数えると“残り”が見えます。『何個なくなった？残りは？』の2段階で聞くと理解が進みます。",
      gen(){ const a=R(5,9),c=R(1,a-1);
        return {hook:"のこりは何こ？", text:`○が ${a}こ。そのうち ${c}こ に ×。のこりは 何こ？`,
          dia:{type:"dots",a:a,b:null,cross:c}, answer:a-c, distractors:[a-c-1,a-c+1,a], unit:"こ"}; } },

    add2:{ name:"たし算（くり上がり）", emoji:"🔟", band:"mid", field:"math", prereq:"add1",
      hint:"数直線で『今ここから○つ進む』と動きで見せます。くり上がりは10のまとまりを意識させると安定します。",
      gen(){ const a=R(6,29),b=R(5,20); const max=Math.ceil((a+b)/10)*10+5;
        return {hook:"数直線で考えよう", text:`${a} + ${b} は いくつ？`,
          dia:{type:"numberline",from:a,to:a+b,amt:b,add:true,max:max,step:5},
          answer:a+b, distractors:[a+b-1,a+b+1,a+b-10], unit:""}; } },

    sub2:{ name:"ひき算（2けた）", emoji:"📉", band:"mid", field:"math", prereq:"add2",
      hint:"数直線を左に戻すイメージ。『○から○つ戻ると？』。くり下がりが苦手ならadd2(たし算)に戻ると効きます。",
      gen(){ const a=R(20,60),b=R(8,a-5); const max=Math.ceil(a/10)*10+5;
        return {hook:"数直線で考えよう", text:`${a} − ${b} は いくつ？`,
          dia:{type:"numberline",from:a,to:a-b,amt:b,add:false,max:max,step:5},
          answer:a-b, distractors:[a-b-1,a-b+1,a-b+10], unit:""}; } },

    mul1:{ name:"かけ算（九九）", emoji:"✖️", band:"mid", field:"math", prereq:"add2",
      hint:"格子の点を『○のかたまりが○つ』と見ると、かけ算＝たし算の近道だと分かります。図の縦×横を一緒に数えて。",
      gen(){ const a=R(2,9),b=R(2,9);
        return {hook:"かたまりで数えよう", text:`${a} × ${b} は いくつ？（${a}が${b}つ）`,
          dia:{type:"array",a:a,b:b}, answer:a*b, distractors:[a*b-a,a*b+b,a*b+a,a*b-b], unit:""}; } },

    div1:{ name:"わり算（分ける）", emoji:"➗", band:"mid", field:"math", prereq:"mul1",
      hint:"『同じ数ずつ箱に配る』のが割り算。図のグループに均等に入る様子を見せ、九九の逆だと気づかせると速いです。",
      gen(){ const g=R(2,5),per=R(2,6),total=g*per;
        return {hook:"同じ数ずつ分けよう", text:`${total}こ を ${g}人で 同じ数ずつ。1人 何こ？`,
          dia:{type:"groups",total:total,g:g}, answer:per, distractors:[per-1,per+1,g,total-g], unit:"こ"}; } },

    fraction:{ name:"分数の大きさ", emoji:"🍕", band:"high", field:"math", prereq:"div1",
      hint:"ピザの絵で『全体を何個に分けて、何個ぶん？』。下の数＝分けた数、上の数＝とった数、と図で対応させて。",
      gen(){ const n=pick([2,3,4,5,6,8]),k=R(1,n-1);
        const mk=(a,b)=>`${a}/${b}`;
        const ds=uniq([mk(k+1,n),mk(k,n+1),mk(n-k,n),mk(1,n)]).filter(x=>x!==mk(k,n)).slice(0,3);
        return {hook:"色は全体のどれだけ？", text:`円を ${n}等分。色がついた部分は 全体の どれだけ？`,
          dia:{type:"pie",n:n,k:k}, answer:mk(k,n), distractors:ds, unit:"", isText:true}; } },

    percent:{ name:"割合・パーセント", emoji:"％", band:"high", field:"money", prereq:"mul1",
      hint:"%は『100にそろえた時いくつ』。図の上段(実際の数)と下段(100スケール)の対応がカギ。割合が苦手ならmul1へ。",
      gen(){ const total=pick([2,4,5,10,20,25,50]),part=R(1,total-1); const pct=part*(100/total);
        return {hook:"100にそろえると何%？", text:`全体 ${total} のうち ${part}。これは 何 % ？`,
          dia:{type:"propbar",total:total,part:part}, answer:pct, distractors:[pct+10,pct-10,part,100-pct].filter(x=>x>0), unit:"%"}; } },

    average:{ name:"平均", emoji:"📊", band:"high", field:"math", prereq:"div1",
      hint:"平均＝でこぼこを平らにならした高さ。棒グラフの点線が平均線。『全部足して回数で割る』を図で確認させて。",
      gen(){ const m=pick([60,70,75,80,85,90]),d=pick([5,10]); const vals=[m-d,m,m+d];
        for(let i=vals.length-1;i>0;i--){const j=R(0,i);[vals[i],vals[j]]=[vals[j],vals[i]];}
        return {hook:"ならすと何点？", text:`テスト ${vals.join("点・")}点。平均は 何点？`,
          dia:{type:"bars",vals:vals,avg:m}, answer:m, distractors:[m-d,m+d,vals[0]], unit:"点"}; } },

    time:{ name:"時計（何時）", emoji:"🕐", band:"low", field:"math", prereq:"count",
      hint:"短い針＝時、長い針＝分。まず短針だけに注目。『短い針はどの数字をさしてる？』と1つずつ。",
      gen(){ const h=R(1,12);
        return {hook:"短いはりに注目", text:`時計の短いはりは 何時を さしてる？`,
          dia:{type:"clock",h:h}, answer:h, distractors:[h===12?1:h+1,h===1?12:h-1,(h+6)>12?h-6:h+6], unit:"時"}; } },

    money:{ name:"お金の計算", emoji:"💰", band:"low", field:"money", prereq:"add1",
      hint:"硬貨の額を声に出して足していくと位取りの練習にも。『100が1つで100、10が2つで20…』とまとめて数えて。",
      gen(){ const c100=R(0,3),c10=R(0,4),c50=R(0,1),c5=R(0,1),c1=R(0,4);
        const coins={100:c100,50:c50,10:c10,5:c5,1:c1};
        const sum=c100*100+c50*50+c10*10+c5*5+c1*1;
        if(sum===0) return this.gen();
        return {hook:"ぜんぶでいくら？", text:`コインを ぜんぶ 合わせると いくら？`,
          dia:{type:"coins",coins:coins}, answer:sum, distractors:[sum-10,sum+10,sum-1,sum+5].filter(x=>x>0), unit:"円"}; } },
  };

  // 帯ごとのスキルの並び（advance に使う）
  const BAND_ORDER = {
    low:  ["count","add1","sub1","time","money"],
    mid:  ["add2","sub2","mul1","div1"],
    high: ["fraction","percent","average"],
  };
  BAND_ORDER.all = [...BAND_ORDER.low,...BAND_ORDER.mid,...BAND_ORDER.high];

  const BANDS_META = {
    all:{name:"ぜんぶ",sub:"おまかせ"},
    low:{name:"低学年",sub:"小1〜2"},
    mid:{name:"中学年",sub:"小3〜4"},
    high:{name:"高学年",sub:"小5〜"},
  };

  // つながる分野チップ用
  const FIELDS = {
    math:{name:"算数・数学",emoji:"🔢"}, money:{name:"お金・経済",emoji:"💰"},
    science:{name:"理科",emoji:"🔬"}, tech:{name:"テクノロジー",emoji:"💻"},
    cooking:{name:"料理",emoji:"🍳"}, sports:{name:"スポーツ",emoji:"⚽"},
    daily:{name:"毎日のくらし",emoji:"🏠"}, game:{name:"ゲーム",emoji:"🎮"},
    lang:{name:"ことば",emoji:"✍️"}, nature:{name:"しぜん",emoji:"🌿"},
    geo:{name:"せかい・地理",emoji:"🗺️"}, health:{name:"からだ",emoji:"🫀"},
    food:{name:"たべもの",emoji:"🍙"}, history:{name:"れきし",emoji:"🏯"},
  };

  // 各スキルの「実生活」と「つながる分野」（取りかかりのハードルを下げる）
  const META = {
    count:  {real:"おやつの数、ならんだ人数、サイコロの目。数えられると“いくつ？”に自分で答えられる。", conn:["daily","game"]},
    add1:   {real:"おこづかいを合わせる、ポイントをためる。たし算は1日で一番使う計算。", conn:["money","daily"]},
    sub1:   {real:"おつり、残りのページ数、HPの減り。ひき算は“あといくつ”が分かる力。", conn:["money","game"]},
    add2:   {real:"買い物の合計、歩いた歩数、点数の合計。大きい数のたし算は生活の中心。", conn:["money","sports"]},
    sub2:   {real:"残り時間、おつり、タイムの差。引き算が速いと段取り上手になる。", conn:["money","sports"]},
    mul1:   {real:"まとめ買い、人数分の用意、面積。九九は“同じ数のかたまり”を一瞬で出す魔法。", conn:["cooking","money"]},
    div1:   {real:"おかしを分ける、チーム分け、レシピを人数で割る。公平に分ける力。", conn:["cooking","game"]},
    fraction:{real:"ピザやケーキを分ける、レシピの1/2。分数は“分け前”そのもの。", conn:["cooking","daily"]},
    percent:{real:"セールの%オフ、電池の残量、テストの正答率。だまされない買い物力。", conn:["money","game"]},
    average:{real:"平均点、平均気温、打率。ニュースは平均だらけ。意味が分かると数字に強くなる。", conn:["sports","science"]},
    time:   {real:"〇時に集合、テレビの時間、ゲームは30分まで。時計が読めると自分で動ける。", conn:["daily","game"]},
    money:  {real:"レジでお金を出す、おつりを確かめる。お金の計算は生きる力に直結。", conn:["money","daily"]},
  };

  /* ============================================================
     トリビア科目（ことば・理科・世界・生活）
     ・プールから毎回ランダムに出題（飽きにくい）
     ・正解はエンジン側でシャッフル
     ・各問に「へぇ！」解説・実生活・つながる分野
     ============================================================ */
  const shuf = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=R(0,i);[a[i],a[j]]=[a[j],a[i]];} return a; };
  // プールから answer 以外の値を3つ取り出す
  function others(pool, key, fn){ return shuf(pool.filter(x=>fn(x)!==key)).slice(0,3).map(fn); }

  // ことば：漢字の読み
  const KANJI=[["山","やま"],["川","かわ"],["火","ひ"],["水","みず"],["木","き"],["空","そら"],
    ["花","はな"],["犬","いぬ"],["雨","あめ"],["月","つき"],["星","ほし"],["海","うみ"],
    ["森","もり"],["風","かぜ"],["雪","ゆき"],["糸","いと"],["貝","かい"],["竹","たけ"]];
  // ことば：反対のことば
  const OPP=[["大きい","小さい"],["高い","ひくい"],["長い","みじかい"],["多い","少ない"],
    ["明るい","くらい"],["あつい","さむい"],["速い","おそい"],["重い","かるい"],
    ["新しい","古い"],["強い","弱い"],["広い","せまい"],["うれしい","かなしい"]];
  // ことば：数え方
  const COUNT=[["🐈 ねこ","ひき"],["📄 かみ","まい"],["🚗 くるま","だい"],["📚 本","さつ"],
    ["✏️ えんぴつ","ほん"],["🐦 とり","わ"],["🍞 食パン","きん"],["👕 服","まい"]];
  const COUNTERS=["ひき","まい","だい","さつ","ほん","わ","こ","きん"];

  // 理科：生きものの分類（おどろきトリビア多め）
  const ANIMAL=[["🦇 コウモリ","けもの","空をとぶけど、子を乳で育てる“けもの（ほ乳類）”！鳥じゃないんだ。"],
    ["🐬 イルカ","けもの","魚に見えて、肺で息をする“けもの”。だから時々水面に上がる。"],
    ["🐳 クジラ","けもの","地球で一番大きい動物シロナガスクジラも“けもの”。赤ちゃんに母乳をあげる。"],
    ["🐧 ペンギン","とり","泳ぐのが得意だけど“鳥”。空は飛べないけど水の中を飛ぶように泳ぐ。"],
    ["🦈 サメ","さかな","エラで呼吸する“魚”。でも骨がやわらかい軟骨でできている。"],
    ["🐸 カエル","りょうせいるい","子（オタマジャクシ）は水中、大人は陸。両方で生きる“両生類”。"],
    ["🐍 ヘビ","はちゅうるい","体温を自分で作れず、日なたで温まる“は虫類”。"],
    ["🦋 チョウ","むし","あしが6本あるのが“虫（こん虫）”の目印。"]];
  const ACLASS=["けもの","とり","さかな","むし","りょうせいるい","はちゅうるい"];

  // 理科：すがた（固体・液体・気体）
  const STATE=[["🧊 氷","こたい"],["💧 水","えきたい"],["♨️ 湯気","きたい"],
    ["🪨 石","こたい"],["🥛 牛にゅう","えきたい"],["🎈 空気","きたい"]];
  const STATES=["こたい","えきたい","きたい"];

  // 理科：からだ・自然の雑学（固定Q）
  const SCITRIVIA=[
    {q:"心臓のおもな仕事は？",a:"血を全身に送る",d:["食べ物をけす","考える","息をする"],e:"心臓は1日に約10万回動くポンプ。休まず血を全身にめぐらせている。",real:"運動で胸がドキドキするのは心臓ががんばっている合図。",conn:["health","sports"]},
    {q:"にじは ふつう何色といわれる？",a:"7色",d:["3色","5色","100色"],e:"本当は境目なくつながる無限の色。ニュートンが音階に合わせ7色と決めた。",real:"雨上がり、太陽を背にすると虹が見える。光の角度がカギ。",conn:["science","nature"]},
    {q:"星の光は“いつの光”を見ている？",a:"ずっと昔の光",d:["今の光","明日の光","音"],e:"星は遠く、光が届くのに何年もかかる。今見える星は過去のすがた。",real:"GPSも光（電波）の届く時間で位置を計算している。",conn:["science","tech"]},
    {q:"植物が日光を浴びて作るのは？",a:"栄養（とさんそ）","d":["土","水だけ","音"],e:"葉が日光で栄養と酸素を作る“光合成”。地球の酸素の多くは植物のおかげ。",real:"森や海の植物プランクトンが、わたしたちの吸う酸素を作っている。",conn:["science","nature"]},
  ];

  // 世界：国旗
  const FLAG=[["🇯🇵","日本"],["🇺🇸","アメリカ"],["🇰🇷","かんこく"],["🇨🇳","ちゅうごく"],
    ["🇫🇷","フランス"],["🇧🇷","ブラジル"],["🇮🇹","イタリア"],["🇬🇧","イギリス"],
    ["🇩🇪","ドイツ"],["🇪🇬","エジプト"],["🇮🇳","インド"],["🇨🇦","カナダ"],["🇦🇺","オーストラリア"]];
  // 世界：あいさつ（こんにちは）
  const HELLO=[["🇺🇸 英語","ハロー"],["🇨🇳 中国語","ニーハオ"],["🇫🇷 フランス語","ボンジュール"],
    ["🇰🇷 かんこく語","アンニョン"],["🇮🇹 イタリア語","チャオ"],["🌺 ハワイ","アロハ"],["🇪🇸 スペイン語","オラ"]];
  const HELLOS=["ハロー","ニーハオ","ボンジュール","アンニョン","チャオ","アロハ","オラ"];

  // 生活：身のまわり
  const LIFE=[
    {q:"信号の「赤」は何の合図？",a:"とまれ",d:["すすめ","ちゅうい","まがれ"],char:"🔴",e:"赤は世界共通で“止まれ”。遠くからでも目立つ色だから選ばれた。",real:"道路をわたる前に必ず確認。命を守るルール。",conn:["daily","geo"]},
    {q:"1週間は何日？",a:"7日",d:["5日","6日","10日"],char:"📅",e:"月・火・水・木・金・土・日の7日。星や神さまの名前が由来。",real:"予定や時間割は1週間でくり返す。曜日が分かると先の見通しが立つ。",conn:["daily","science"]},
    {q:"1年は何か月？",a:"12か月",d:["10か月","7か月","24か月"],char:"🗓️",e:"地球が太陽を1周する間が1年＝12か月。季節が一回りする。",real:"誕生日や行事は1年でひとめぐり。カレンダーの基本。",conn:["daily","science"]},
    {q:"火事のときに呼ぶ番号は？",a:"119",d:["110","117","911"],char:"🚒",e:"日本では火事・救急は119、事件・事故は110。覚えておくと安心。",real:"いざという時に自分で電話できる力は、立派な“生きる力”。",conn:["daily","health"]},
    {q:"日本でいちばん高い山は？",a:"富士山",d:["エベレスト","高尾山","あさま山"],char:"🗻",e:"富士山は3776m。きれいな形で昔から絵や歌になってきた日本の象徴。",real:"お札や絵にもよく登場。地元の山の高さも調べると面白い。",conn:["geo","history"]},
  ];

  // 各トリビア科目のジェネレーター（共通の正規化フォーマットを返す）
  const TRIVIA = {
    kanji:{ cat:"kotoba", name:"漢字のよみ", emoji:"✍️",
      gen(){ const it=pick(KANJI);
        return {hook:"この漢字、なんて読む？", text:`「${it[0]}」の よみ方は？`,
          dia:{type:"word",word:it[0]}, answer:it[1], distractors:others(KANJI,it[1],x=>x[1]), isText:true,
          explain:`「${it[0]}」は「${it[1]}」。声に出すと覚えやすい。`,
          real:"看板・本・ゲームの文字…漢字が読めると世界がぐっと広がる。", conn:["lang","daily"]}; } },
    opp:{ cat:"kotoba", name:"反対のことば", emoji:"🔁",
      gen(){ const it=pick(OPP), flip=R(0,1); const w=it[flip], a=it[1-flip];
        const ds=shuf(OPP.flatMap(p=>p).filter(x=>x!==a&&x!==w)).slice(0,3);
        return {hook:"反対のことばは？", text:`「${w}」の 反対は？`,
          dia:{type:"word",word:w}, answer:a, distractors:ds, isText:true,
          explain:`「${w}」⇔「${a}」。反対語はセットで覚えるとお得。`,
          real:"気持ちや様子を正しく伝えられる。作文や会話の表現力アップ。", conn:["lang","daily"]}; } },
    counter:{ cat:"kotoba", name:"数え方", emoji:"🔢",
      gen(){ const it=pick(COUNT);
        return {hook:"正しい数え方は？", text:`${it[0]} を 1つ数えるとき、正しいのは？`,
          dia:{type:"emoji",char:it[0].split(" ")[0],sub:it[0].split(" ")[1]}, answer:it[1],
          distractors:shuf(COUNTERS.filter(x=>x!==it[1])).slice(0,3), isText:true,
          explain:`${it[0]} は「1${it[1]}」と数える。日本語は物ごとに数え方が変わる珍しい言語。`,
          real:"お店やお手伝いで「○まい」「○こ」と正しく言えると伝わりやすい。", conn:["lang","daily"]}; } },
    animal:{ cat:"science", name:"生きものの分類", emoji:"🦁",
      gen(){ const it=pick(ANIMAL);
        return {hook:"これは何のなかま？", text:`${it[0]} は どのなかま？`,
          dia:{type:"emoji",char:it[0].split(" ")[0],sub:it[0].split(" ")[1]}, answer:it[1],
          distractors:shuf(ACLASS.filter(x=>x!==it[1])).slice(0,3), isText:true,
          explain:it[2], real:"動物園や図かんが何倍も面白くなる。見分けのコツが身につく。", conn:["science","nature"]}; } },
    state:{ cat:"science", name:"すがた（こたい・えきたい・きたい）", emoji:"🧊",
      gen(){ const it=pick(STATE);
        return {hook:"これは どのすがた？", text:`${it[0]} は こたい・えきたい・きたい の どれ？`,
          dia:{type:"emoji",char:it[0].split(" ")[0],sub:it[0].split(" ")[1]}, answer:it[1],
          distractors:STATES.filter(x=>x!==it[1]), isText:true,
          explain:`${it[0]} は「${it[1]}」。水は冷えると氷(こたい)、温めると湯気(きたい)に姿を変える。`,
          real:"料理（こおらす・とかす・むす）はすがたの変化そのもの。", conn:["science","cooking"]}; } },
    scitrivia:{ cat:"science", name:"りかの雑学", emoji:"🔬",
      gen(){ const it=pick(SCITRIVIA);
        return {hook:"へぇ！となる理科クイズ", text:it.q, dia:{type:"emoji",char:"🔬"},
          answer:it.a, distractors:it.d, isText:true, explain:it.e, real:it.real, conn:it.conn}; } },
    flag:{ cat:"world", name:"国旗クイズ", emoji:"🚩",
      gen(){ const it=pick(FLAG);
        return {hook:"この国旗、どこの国？", text:`この国旗は どこの国？`,
          dia:{type:"emoji",char:it[0]}, answer:it[1], distractors:others(FLAG,it[1],x=>x[1]), isText:true,
          explain:`これは ${it[1]} の国旗。旗の色や形には、その国の歴史や願いがこめられている。`,
          real:"オリンピックやサッカー、ニュースの世界地図がわかるようになる。", conn:["geo","history"]}; } },
    hello:{ cat:"world", name:"世界のあいさつ", emoji:"👋",
      gen(){ const it=pick(HELLO);
        return {hook:"「こんにちは」は何という？", text:`${it[0]} で「こんにちは」は？`,
          dia:{type:"emoji",char:it[0].split(" ")[0]}, answer:it[1],
          distractors:shuf(HELLOS.filter(x=>x!==it[1])).slice(0,3), isText:true,
          explain:`${it[0]} の「こんにちは」は「${it[1]}」。あいさつは世界中の人と仲よくなる魔法の言葉。`,
          real:"外国の人に出会ったとき、ひと言いえるだけで笑顔になってもらえる。", conn:["geo","lang"]}; } },
    life:{ cat:"life", name:"せいかつの知恵", emoji:"🏠",
      gen(){ const it=pick(LIFE);
        return {hook:"知ってると役立つクイズ", text:it.q, dia:{type:"emoji",char:it.char},
          answer:it.a, distractors:it.d, isText:true, explain:it.e, real:it.real, conn:it.conn}; } },
  };

  // 科目カテゴリ（こども向けの選択肢）
  const CATEGORIES = {
    mix:    {name:"ミックス", emoji:"🎲"},
    math:   {name:"かず",     emoji:"🔢"},
    kotoba: {name:"ことば",   emoji:"✍️"},
    science:{name:"りか",     emoji:"🔬"},
    world:  {name:"せかい",   emoji:"🌍"},
    life:   {name:"せいかつ", emoji:"🏠"},
  };
  // ミックスの回し順（同じ科目が連続しない／算数は約1/3）
  const MIX_CYCLE = ["kotoba","math","science","world","math","life"];
  // カテゴリ→トリビアgenのid一覧
  const CAT_TRIVIA = {
    kotoba:["kanji","opp","counter"], science:["animal","state","scitrivia"],
    world:["flag","hello"], life:["life"],
  };

  window.ENGINE = {SKILLS, BAND_ORDER, BANDS_META, FIELDS, META, TRIVIA, CATEGORIES, MIX_CYCLE, CAT_TRIVIA, renderDia, R, pick};
})();
