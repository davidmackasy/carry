export async function preparePhoto(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPEG, PNG, or WebP image.');
 if(file.size>15000000)throw new Error('Choose an image smaller than 15 MB.');
 const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare photo.')),'image/jpeg',.85));if(blob.size>2000000)throw new Error('This image is too detailed. Try a smaller photo.');return blob;}finally{bitmap.close();}
}
export async function uploadPhoto(photo:Blob){const response=await fetch('/api/media',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:photo});const result=await response.json() as {id:string;error?:string};if(!response.ok)throw new Error(result.error??'Could not save photo.');return result.id;}
