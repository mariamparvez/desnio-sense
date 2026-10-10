import {publicCatalogue} from '../server/public-catalogue.mjs';
export async function GET(){const data=await publicCatalogue();return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=0, s-maxage=60, stale-while-revalidate=120'}});}

