// Owner-approved catalogue update, 5 November 2026. Prices are applied only once.
export const APPAREL_SIZES=Object.freeze(['XS','S','M','L','XL','2XL','3XL']);
export const APPAREL_TYPES=Object.freeze(['tshirt','jersey','hoodie','sweatshirt']);
const INITIAL_PRICES=Object.freeze({case:140,hoodie:840,sweatshirt:850,cap:126,journal:740});
export const CATEGORY_PRICES=Object.freeze({...INITIAL_PRICES,tote:150,mug:230});
export const CATALOGUE_POLICY_ID='owner-catalogue-2026-11-05-v1';
export const TOTE_PRICE_POLICY_ID='owner-tote-price-2026-11-05-v1';
export const REFERENCE_PRICE_POLICY_ID='owner-reference-prices-and-cups-2026-11-05-v1';
export const CATALOGUE_POLICY_IDS=Object.freeze([CATALOGUE_POLICY_ID,TOTE_PRICE_POLICY_ID,REFERENCE_PRICE_POLICY_ID]);
export function cataloguePolicyPatch(product,updatedAt,policy=CATALOGUE_POLICY_ID){
 const base=product.baseId||product.id,patch={};
 if(!CATALOGUE_POLICY_IDS.includes(policy))throw new Error('Unknown catalogue policy.');
 if(policy===REFERENCE_PRICE_POLICY_ID){
  if(base==='mug'&&product.price!==230)patch.price=230;
  if(product.referenceMarkupPercent!==10)patch.referenceMarkupPercent=10;
  // This confirmed catalogue-wide display replaces the previous product offers.
  if(product.offer!=null)patch.offer=null;
  return Object.keys(patch).length?{...patch,updatedAt}:null;
 }
 const prices=policy===TOTE_PRICE_POLICY_ID?{tote:150}:INITIAL_PRICES;
 if(Object.hasOwn(prices,base)&&product.price!==prices[base])patch.price=prices[base];
 if(policy===CATALOGUE_POLICY_ID&&APPAREL_TYPES.includes(base)&&JSON.stringify(product.variants)!==JSON.stringify(APPAREL_SIZES))patch.variants=[...APPAREL_SIZES];
 return Object.keys(patch).length?{...patch,updatedAt}:null;
}
