import { firebaseConfig } from './firebase-config.js?v=20261007-1045';

let ctx;
async function fb(){
  if(ctx) return ctx;
  const [appMod,fsMod,storageMod]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js')
  ]);
  const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(firebaseConfig);
  ctx={db:fsMod.getFirestore(app),storage:storageMod.getStorage(app),fsMod,storageMod};
  return ctx;
}
export function subscribeHccRequests(callback){
  let unsub=()=>{};
  fb().then(({db,fsMod})=>{
    const q=fsMod.query(fsMod.collection(db,'hcc_requests'),fsMod.orderBy('createdAt','desc'));
    unsub=fsMod.onSnapshot(q,snap=>callback(snap.docs.map(d=>{
      const v=d.data();
      return {id:d.id,...v,sector:'HCC',
        createdAt:v.createdAt?.toDate?v.createdAt.toDate().toISOString():v.createdAt,
        updatedAt:v.updatedAt?.toDate?v.updatedAt.toDate().toISOString():v.updatedAt,
        resolvedAt:v.resolvedAt?.toDate?v.resolvedAt.toDate().toISOString():v.resolvedAt};
    }).filter(x=>x.sector==='HCC')));
  });
  return ()=>unsub();
}
export async function updateHccRequest(id,patch,{actor='Service HCC',actionLabel='Demande HCC modifiée'}={}){
  const {db,fsMod}=await fb();
  const event={type:patch.status?'status':'update',label:actionLabel,at:new Date().toISOString(),actor};
  const data={...patch,sector:'HCC',updatedAt:fsMod.serverTimestamp(),history:fsMod.arrayUnion(event)};
  if(patch.status==='resolu') data.resolvedAt=fsMod.serverTimestamp();
  if(patch.status&&patch.status!=='resolu') data.resolvedAt=null;
  await fsMod.updateDoc(fsMod.doc(db,'hcc_requests',id),data);
}
export async function deleteHccRequest(id){
  const {db,fsMod}=await fb();
  await fsMod.deleteDoc(fsMod.doc(db,'hcc_requests',id));
}
export async function syncHccRoomStatuses(){ return; }
