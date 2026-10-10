# Product offers and coupons

Sign in at `/admin-login.html` with the Super Admin email and the owner-supplied password. Admin access uses email and password only. Existing other admin access has been disabled; customer accounts remain separate.

In **Products & designers → Edit**, enter the original price. In **Product offer**, choose Percentage or Rupees, enter a discount, optionally set a start time and set an end time. Times use the administrator's local timezone. Active offers show a crossed-out original price beside the selling price on home cards, listings and product pages. Offers automatically stop at the end time. No product offer has been applied automatically; the existing ₹1 prices remain.

In **Coupons & offers**, create a unique code with a percentage or rupee amount, minimum spend, optional maximum discount, dates and eligible products. Leaving products unchecked applies the coupon to all products. Coupons apply after product offers. Inactive, expired and ineligible codes are rejected. Cart quotes and order totals are calculated on the server, ignoring browser-supplied prices.

In **Admins**, only the Super Admin can add staff with their emails, designations and passwords. Editing can set a new password; existing passwords cannot be viewed. The portal shows account creation, last sign-in, password-change time and recent admin changes. Removing staff disables sign-in and revokes permissions while retaining historical records. Only the owner's account has Super Admin authority.

The public catalogue uses a cached bundle of approved products, refreshed by catalogue changes. During database outages, the last verified public catalogue is used for browsing. Private admin records, coupons and payment decisions never use that fallback. Live database quota recovery is required to verify and use admin changes during the current outage. Firebase billing remains disabled.

