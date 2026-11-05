export const faces=[];
const red=['#a92131','#bf3040','#971f30','#ce3b47','#da4650','#701a26'];
const yellow=['#e3bd25','#efca36','#c49b18','#f9d742','#ffe065','#b89118'];
const steel=['#aebbc5','#c3cdd5','#8a9aa8','#d2dbe2','#e3ebf0','#72818d'];
const dark=['#202b35','#303c47','#1d2732','#35424e','#495863','#17212a'];
const glass=['#426777','#335667','#2a4a59','#4c7182','#648798','#263d49'];
function poly(points,fill,outline='#152433'){faces.push({points,fill,outline});}
function box(x0,x1,y0,y1,z0,z1,colors){
 const a=[x0,y0,z0], b=[x1,y0,z0], c=[x1,y1,z0], d=[x0,y1,z0];
 const e=[x0,y0,z1], f=[x1,y0,z1], g=[x1,y1,z1], h=[x0,y1,z1];
 [[a,b,c,d],[f,e,h,g],[e,a,d,h],[b,f,g,c],[d,c,g,h],[e,f,b,a]].forEach((q,i)=>poly(q,colors[i]));
}
const flat=(color)=>Array(6).fill(color);
function cylinder(x,y,z0,z1,r,colors){
 const n=20, ring=z=>Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n),z]);
 const a=ring(z0),b=ring(z1);
 for(let i=0;i<n;i++){const j=(i+1)%n;poly([a[i],a[j],b[j],b[i]],colors[i%colors.length]);}
 poly(a,colors[0]);poly(b,colors[0]);
}
// x pointe vers l’avant. y est la hauteur et z va vers le côté gauche.
box(-2.78,2.8,.51,.82,-.76,.76,dark);
box(-2.70,-.32,.99,2.28,-.91,.91,red);
box(-.12,1.035,.96,2.33,-.87,.87,red);
box(1.035,2.12,.96,2.33,-.87,.87,red);
box(2.12,2.80,.83,1.55,-.87,.87,red);
box(-.15,2.15,2.33,2.41,-.90,.90,yellow);
box(.81,1.08,2.40,2.50,-.20,.20,glass);
box(-2.99,-2.49,.57,.68,-.98,.98,steel);
box(2.77,3,.66,.86,-.99,.99,yellow);
box(-2.77,-2.59,2.26,2.32,-.94,.94,steel);
box(-2.66,-.42,2.28,2.33,-.91,-.59,steel);
box(-2.66,-.42,2.28,2.33,.58,.91,steel);
box(-2.29,-1.46,2.28,2.36,-.27,.32,dark);
box(-1.17,-.68,2.28,2.39,-.23,.25,red);
for(const side of [-1,1]){
 const outer=(a,b)=>side===1?[a,b]:[-b,-a];
 const detail=(a,b,y0,y1,z0,z1,col)=>box(a,b,y0,y1,...outer(z0,z1),col);
 detail(-2.63,-.42,2.18,2.34,.91,.94,yellow);
 for(const x of [-2.61,-1.91,-1.23]){
  detail(x,x+.65,1.07,2.12,.91,.931,red);
  detail(x+.49,x+.56,1.56,1.63,.931,.948,dark);
  detail(x,x+.64,1.12,1.18,.932,.947,yellow);
 }
 for(const x of [.01,1.06]){
  detail(x,x+.98,1.02,2.26,.87,.89,red);
  detail(x+.09,x+.91,1.73,2.21,.891,.901,glass);
  detail(x+.10,x+.28,1.54,1.61,.90,.925,yellow);
  detail(x+.02,x+.96,1.19,1.25,.89,.91,yellow);
 }
 detail(-.36,-.16,.95,2.29,.91,.95,yellow);
 for(let y=1.04;y<2.2;y+=.19)detail(-.42,-.12,y,y+.035,.93,.97,steel);
 detail(.65,1.4,.63,.79,.79,.96,steel);
 detail(1.98,2.12,1.83,2.13,.90,.99,dark);
 detail(-.17,2.34,2.425,2.465,.89,.94,yellow);
 detail(2.31,2.36,1.53,2.45,.89,.94,yellow);
 for(const x of [-1.87,1.94]){
   const wheel=outer(.60,.975), rim=outer(.974,.989);
   cylinder(x,.48,...wheel,.48,['#27313a','#202831','#2a343e']);
   cylinder(x,.48,...rim,.24,['#556372','#465460']);
   cylinder(x,.48,...outer(.988,.998),.10,['#263744']);
 }
 const reel=outer(.43,.88);
 cylinder(-2.76,1.38,...reel,.22,side===1?['#ce572c','#ec7439']:['#a52434','#d13b49']);
 for(let z=.45;z<.88;z+=.065)cylinder(-2.76,1.38,...outer(z,z+.016),.226,flat('#7e2930'));
 detail(-2.99,-2.965,.62,.76,.65,.91,red);
 detail(2.988,3,.70,.82,.63,.93,flat('#fff2bc'));
}
// Pare-brise, calandre et arceau.
poly([[2.128,1.65,-.77],[2.128,1.65,.77],[2.128,2.26,.77],[2.128,2.26,-.77]],'#3f6474');
box(2.135,2.15,1.94,1.97,-.70,.70,dark);
box(2.80,2.825,1.01,1.44,-.78,.78,dark);
for(const y of [1.08,1.19,1.30])box(2.826,2.845,y,y+.026,-.72,.72,steel);
for(const z of [-.91,.86])box(2.84,2.89,.86,1.54,z,z+.05,yellow);
for(const y of [1.02,1.38])box(2.85,2.89,y,y+.047,-.9,.9,yellow);
box(2.26,2.31,2.42,2.47,-.93,.93,yellow);
// Chevrons, pupitre et raccords de la pompe arrière.
box(-2.735,-2.704,1.94,2.22,-.90,.90,red);
for(let z=-.85;z<.70;z+=.28)poly([[-2.737,1.95,z],[-2.737,1.95,z+.13],[-2.737,2.21,z+.28],[-2.737,2.21,z+.15]],'#f4d336','transparent');
box(-2.93,-2.71,1.05,1.50,-.35,.35,red);
box(-2.94,-2.93,1.20,1.46,-.28,.28,dark);
for(const z of [-.24,0,.24])box(-2.96,-2.83,.88,1.04,z-.055,z+.055,steel);
