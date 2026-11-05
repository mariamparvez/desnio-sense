// Owner-approved catalogue update, 5 November 2026. Prices are applied only once.
export const APPAREL_SIZES=Object.freeze(['XS','S','M','L','XL','2XL','3XL']);
export const APPAREL_TYPES=Object.freeze(['tshirt','jersey','hoodie','sweatshirt']);
export const CATEGORY_PRICES=Object.freeze({case:140,hoodie:840,sweatshirt:850,cap:126,journal:740});
export const CATALOGUE_POLICY_ID='owner-catalogue-2026-11-05-v1';
export function cataloguePolicyPatch(product,updatedAt){
 const base=product.baseId||product.id,patch={};
 if(Object.hasOwn(CATEGORY_PRICES,base)&&product.price!==CATEGORY_PRICES[base])patch.price=CATEGORY_PRICES[base];
 if(APPAREL_TYPES.includes(base)&&JSON.stringify(product.variants)!==JSON.stringify(APPAREL_SIZES))patch.variants=[...APPAREL_SIZES];
 return Object.keys(patch).length?{...patch,updatedAt}:null;
}
