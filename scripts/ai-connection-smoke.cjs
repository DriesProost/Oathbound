const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[],calls=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5173');await p.evaluate(async()=>{const {createKnight}=await import('/src/domain.ts');localStorage.clear();localStorage.setItem('oathbound.knight.v7',JSON.stringify(createKnight('Private name','2026-10-01')));});await p.reload();
 const go=async name=>{const nav=await p.getByRole('navigation',{name:'Main navigation'}).isVisible()?'Main navigation':'Desktop navigation';await p.getByRole('navigation',{name:nav}).getByRole('button',{name,exact:true}).click();};
 const open=async()=>{await go('Knight');await p.getByText('Narrative preferences',{exact:false}).filter({hasText:'Optional AI storyteller'}).first().click();};
 await open();
 const endpoint=p.getByLabel('Chat-completions endpoint',{exact:true}),key=p.getByLabel('API key',{exact:true});assert.equal(await endpoint.inputValue(),'https://api.openai.com/v1/chat/completions');assert.equal(await p.getByLabel('Remember key on this device',{exact:true}).isChecked(),true);
 let mode='success';
 await p.route('https://api.openai.com/v1/chat/completions',async route=>{
  calls.push({body:route.request().postDataJSON(),authorization:route.request().headers().authorization});
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization'};
  if(mode==='slow'){await new Promise(r=>setTimeout(r,200));return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({model:'gpt-6-luna',choices:[{message:{content:'{"ok":true}'}}]})}).catch(()=>{});}
  if(mode==='success')return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({model:'gpt-6-luna',choices:[{message:{content:'{"ok":true}'}}]})});
  if(mode==='model')return route.fulfill({status:404,headers,contentType:'application/json',body:JSON.stringify({error:{code:'model_not_found',message:'Provider echoed sk-test-private-value'}})});
  if(mode==='quota')return route.fulfill({status:429,headers,contentType:'application/json',body:JSON.stringify({error:{code:'insufficient_quota',message:'Provider echoed sk-test-private-value'}})});
  return route.fulfill({status:401,headers,contentType:'application/json',body:JSON.stringify({error:{code:'invalid_api_key',message:'Provider echoed sk-test-private-value'}})});
 });
 await key.fill('sk-test-private-value');await p.getByRole('button',{name:'Test connection',exact:true}).click();await p.getByRole('status').filter({hasText:'Connection works'}).waitFor();
 assert.equal(calls.length,1);assert.equal(calls[0].authorization,'Bearer sk-test-private-value');assert.equal(calls[0].body.model,'gpt-6-luna');assert.equal(calls[0].body.reasoning_effort,'low');assert.ok(!JSON.stringify(calls[0].body).includes('Private name'));assert.equal(await p.evaluate(()=>localStorage.getItem('oathbound.ai-credential.v1')),null);
 await p.getByRole('button',{name:'Save narrative preferences',exact:true}).click();await p.getByRole('status').filter({hasText:'Your key is remembered on this device'}).waitFor();assert.equal(await key.inputValue(),'');
 const baseline=await p.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7')));assert.ok(!JSON.stringify(baseline).includes('sk-test-private-value'));
 await p.reload();await open();assert.equal(await key.inputValue(),'');await p.getByText('Key remembered on this device.',{exact:true}).waitFor();await p.getByRole('button',{name:'Test connection',exact:true}).click();await p.getByRole('status').filter({hasText:'Connection works'}).waitFor();assert.equal(calls.at(-1).authorization,'Bearer sk-test-private-value');
 // A changed endpoint must not inherit the saved secret.
 let otherAuthorization='not-called';await p.route('https://other.example/chat/completions',route=>{otherAuthorization=route.request().headers().authorization;return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization'},body:JSON.stringify({model:'gpt-6-luna',choices:[{message:{content:'{"ok":true}'}}]})});});
 await endpoint.fill('https://other.example/chat/completions');assert.equal(await p.getByRole('status').filter({hasText:'Connection works'}).count(),0);await p.getByRole('button',{name:'Test connection',exact:true}).click();await p.getByRole('status').filter({hasText:'Connection works'}).waitFor();assert.equal(otherAuthorization,undefined);await endpoint.fill('https://api.openai.com/v1/chat/completions');
 for(const [failure,text] of [['auth','The API key was rejected'],['model','cannot access gpt-6-luna'],['quota','no available quota']]){mode=failure;await p.getByRole('button',{name:'Test connection',exact:true}).click();await p.getByRole('alert').filter({hasText:text}).waitFor();assert.ok(!(await p.locator('.connection-result').textContent()).includes('sk-test-private-value'));}
 // Saving unrelated preferences with an empty field must retain the old key.
 await p.getByText('Fine-tune suggestions',{exact:true}).click();await p.getByLabel('Preferred Venture minutes',{exact:true}).fill('25');await p.getByRole('button',{name:'Save narrative preferences',exact:true}).click();assert.ok(await p.evaluate(()=>localStorage.getItem('oathbound.ai-credential.v1')));
 await p.getByRole('button',{name:'Forget saved key',exact:true}).click();await p.getByRole('status').filter({hasText:'Key forgotten'}).waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('oathbound.ai-credential.v1')),null);
 const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7')));for(const field of ['entries','oaths','ventures','weekly','world','weight'])assert.deepEqual(after[field],baseline[field]);
 // Test can use an unsaved key, be cancelled, and cannot accidentally submit the form.
 mode='slow';await key.fill('unsaved-test-key');const prior=await p.evaluate(()=>localStorage.getItem('oathbound.knight.v7'));await p.getByRole('button',{name:'Test connection',exact:true}).click();await p.getByRole('button',{name:'Cancel connection test',exact:true}).click();await p.getByRole('status').filter({hasText:'Connection test cancelled'}).waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('oathbound.knight.v7')),prior);
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`AI settings overflow ${width}`);}
 assert.deepEqual(errors,[]);console.log('PASS: default OpenAI endpoint, explicit device retention, real JSON/model connection probe, remembered key after reload, blank saves preserve key, endpoint binding, actionable/redacted errors, forget, cancellation, unchanged campaign history and 320–1440px layouts.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
