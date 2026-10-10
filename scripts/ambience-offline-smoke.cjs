// Actual decoding/playback of the supplied track from a production offline shell.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve('dist');let server,browser;
 try {
  server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/Oathbound\//,'')||'index.html';const file=path.resolve(root,name);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
   const mime={'.js':'text/javascript','.css':'text/css','.m4a':'audio/mp4','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[path.extname(file)]||'text/html';res.setHeader('Content-Type',mime);res.end(fs.readFileSync(file));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await page.addInitScript(()=>{window.musicPlayback=[];const Native=window.AudioContext;window.AudioContext=class extends Native {createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{window.musicPlayback.push({duration:source.buffer.duration,channels:source.buffer.numberOfChannels,loop:source.loop});return start(...args);};return source;}};});
  await page.goto(`http://127.0.0.1:${server.address().port}/Oathbound/`);await page.waitForFunction(()=>navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  assert.equal(await page.evaluate(()=>window.musicPlayback.length),0);
  const before=await page.evaluate(()=>localStorage.getItem('oathbound.knight.v3'));
  await page.getByRole('button',{name:'Sound effects settings'}).click();await page.getByRole('button',{name:'Play ambience',exact:true}).click();await page.getByRole('button',{name:'Mute ambience',exact:true}).waitFor();
  const [track]=await page.evaluate(()=>window.musicPlayback);assert.ok(Math.abs(track.duration-57.73)<.1);assert.equal(track.channels,2);assert.equal(track.loop,true);
  await page.getByRole('button',{name:'Mute ambience',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('oathbound.knight.v3')),before);
  console.log('PASS: supplied 57.73-second stereo recording decodes and loops offline under /Oathbound/; no autoplay or campaign changes; mute remains available.');
 }finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
