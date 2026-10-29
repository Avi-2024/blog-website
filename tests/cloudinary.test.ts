import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {cloudinarySelected,uploadCloudinaryWebp} from '../src/lib/cms/cloudinary';

const original={
  CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET,
};
const savedFetch=globalThis.fetch;
afterEach(()=>{
  for(const key of Object.keys(original) as (keyof typeof original)[]){
    const value=original[key];
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
  globalThis.fetch=savedFetch;
});
test('Cloudinary is selected only when at least one cloud variable exists',()=>{
  assert.equal(cloudinarySelected({}),false);
  assert.equal(cloudinarySelected({CLOUDINARY_CLOUD_NAME:'example'}),true);
});
test('partial configuration fails without network request',async()=>{
  process.env.CLOUDINARY_CLOUD_NAME='mycloud';
  delete process.env.CLOUDINARY_API_KEY;delete process.env.CLOUDINARY_API_SECRET;
  await assert.rejects(uploadCloudinaryWebp(Buffer.from('notreal')),/not completely configured/);
});
test('authenticated WebP upload saves provider verified secure_url',async()=>{
  process.env.CLOUDINARY_CLOUD_NAME='mycloud';
  process.env.CLOUDINARY_API_KEY='123456789';
  process.env.CLOUDINARY_API_SECRET='test-private-secret';
  let called=false;
  globalThis.fetch=async(input,init)=>{
    called=true;
    assert.equal(input,'https://api.cloudinary.com/v1_1/mycloud/image/upload');
    const headers=new Headers(init?.headers);
    assert.equal(headers.get('authorization'),'Basic '+Buffer.from('123456789:test-private-secret').toString('base64'));
    assert.equal(init?.method,'POST');
    assert.ok(init?.body instanceof FormData);
    const body=init.body as FormData;
    assert.equal(body.get('overwrite'),'false');
    const publicId=body.get('public_id') as string;
    assert.match(publicId,/^toolvaluelab\/[0-9a-f-]{36}$/);
    const file=body.get('file');
    assert.ok(file instanceof Blob);
    assert.equal(file.type,'image/webp');
    return Response.json({secure_url:`https://res.cloudinary.com/mycloud/image/upload/v123/${publicId}.webp`,public_id:publicId,resource_type:'image',format:'webp'});
  };
  const url=await uploadCloudinaryWebp(Buffer.from('webp-test'));
  assert.ok(called);
  assert.ok(url.startsWith('https://res.cloudinary.com/mycloud/image/upload/'));
});
test('rejects invalid provider response',async()=>{
  process.env.CLOUDINARY_CLOUD_NAME='mycloud';
  process.env.CLOUDINARY_API_KEY='123456789';
  process.env.CLOUDINARY_API_SECRET='test-private-secret';
  globalThis.fetch=async()=>Response.json({secure_url:'https://evil.test/image',public_id:'wrong',resource_type:'image',format:'webp'});
  await assert.rejects(uploadCloudinaryWebp(Buffer.from('test')),/invalid image response/);
});
