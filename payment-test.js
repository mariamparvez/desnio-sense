// Sandbox checkout is offered only to the authenticated Admin Head.
window.TestCheckout={
 async mount(panel,details){
  if(DS.session()?.role!=='Admin Head'||!Backend.features.testPayments)return;
  const box=document.createElement('section');box.className='test-payment-panel';
  box.innerHTML='<hr><p class="eyebrow">Admin Head · Sandbox</p><h3>Test Razorpay checkout</h3><p>No real money is charged. Test orders do not count as revenue and cannot enter production or shipment.</p><button class="btn" id="razorpay-test">Open test checkout →</button><button class="btn secondary" id="razorpay-check" hidden>Check test payment status</button><p id="razorpay-result" role="status" aria-live="polite"></p>';
  panel.append(box);
  const pay=box.querySelector('#razorpay-test'),check=box.querySelector('#razorpay-check'),result=box.querySelector('#razorpay-result'),save=panel.querySelector('#save-order-request');
  let attempt=Store.get('test-checkout',null),busy=false;
  const valid=()=>!!DS.getCart().length&&!!DS.session()?.emailVerified&&!!details.address&&!DS.getCart().some(i=>i.custom);
  function lock(value){busy=value;pay.disabled=value||!valid();check.disabled=value;save.disabled=value||!valid();}
  async function verified(response){
   if(response.payment==='Test paid'&&response.order){await Backend.finishTestPayment(response.order);location.href='order-confirmation.html?order='+encodeURIComponent(response.order.id);return;}
   result.textContent=(response.payment||'Test pending')+'. No real money was charged. Use Check test payment status if capture is still pending.';
  }
  check.hidden=!attempt?.id;lock(false);
  check.onclick=async()=>{if(busy||!attempt)return;lock(true);try{await verified(await Backend.testPaymentStatus(attempt.id));}catch(error){result.textContent=Backend.errorMessage(error);}finally{lock(false);}};
  pay.onclick=async()=>{
   if(busy||!valid())return;lock(true);result.textContent='Preparing server-verified test checkout…';
   try{
    await loadRazorpay();const response=await Backend.startTestPayment(details);attempt={id:response.order.id,providerOrderId:response.providerOrderId};check.hidden=false;
    if(response.order.payment==='Test paid'){await verified({order:response.order,payment:'Test paid'});return;}
    result.textContent='Test amount: '+money(response.amount/100)+'. Choose a test payment method in Razorpay.';
    const checkout=new Razorpay({key:response.keyId,amount:response.amount,currency:response.currency,order_id:response.providerOrderId,name:'Desnio Sense',description:'SANDBOX TEST · No fulfilment',prefill:{name:details.name,email:DS.session().email,contact:details.phone},theme:{color:'#27474e'},
     handler:async payment=>{lock(true);result.textContent='Verifying the test payment with Razorpay…';try{await verified(await Backend.verifyTestPayment(attempt.id,payment));}catch(error){result.textContent=Backend.errorMessage(error)+' Use Check test payment status to reconcile this attempt.';}finally{lock(false);}},
     modal:{ondismiss:()=>{result.textContent='Test checkout closed. Your cart is kept. Check its status before starting another attempt.';lock(false);}}
    });
    checkout.on('payment.failed',()=>{result.textContent='The test payment failed. Your cart is kept. Check the payment status before retrying.';lock(false);});checkout.open();
   }catch(error){result.textContent=Backend.errorMessage(error);lock(false);}
  };
 }
};
let razorpayLoading;
function loadRazorpay(){
 if(window.Razorpay)return Promise.resolve();if(razorpayLoading)return razorpayLoading;
 razorpayLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;const timer=setTimeout(()=>{script.remove();reject(new Error('Razorpay could not load. Please retry.'));},30000);script.onload=()=>{clearTimeout(timer);window.Razorpay?resolve():reject(new Error('Razorpay checkout is unavailable.'));};script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Razorpay could not load. Check your connection.'));};document.head.append(script);}).catch(error=>{razorpayLoading=null;throw error;});return razorpayLoading;
}
