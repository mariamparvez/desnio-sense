(async()=>{
 const form=document.querySelector('#corporate-form'),result=document.querySelector('#corporate-result');
 form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;button.textContent='Sending…';result.textContent='';
  try{await DS.ready;const data=Object.fromEntries(new FormData(form));data.quantity=Number(data.quantity);data.consent=data.consent==='on';const token=await Backend.browserAttestation();const response=await fetch('/api/store?action=corporate-enquiry',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Firebase-AppCheck':token}:{})},body:JSON.stringify(data)});const saved=await response.json();if(!response.ok)throw Error(saved.error||'Unable to send. Please try again.');result.textContent='Your bulk enquiry is saved. Reference '+saved.id+'. Our team will contact you using the details you provided. You can also WhatsApp, text or call us.';form.reset();}
  catch(error){result.textContent=(error.message||'Unable to send right now.')+' You can reach us directly using WhatsApp, text or call.';}
  finally{button.disabled=false;button.textContent='Send enquiry ↗';}
 });
})().catch(error=>DS.fail(error));

