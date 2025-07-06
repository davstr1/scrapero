Your mission is to implement subcategories in our Wix marketplace scraper. 

Till now you successfully scraped the marketplace with our scraper And implemented categories 

We are still missing subcategories. 

Subcategories are directly accessible in the web page of an app. 

They are also implemented with some semantic tags. 

Your mission now is to deduce how to retrieve systematically those categories from every marketplace app. 

Take a look at this app. 

https://es.wix.com/app-market/web-solution/quickbooks-online

In the HTML code, you will find this. 

<div data-hook="categories-tags" class="wds_1_182_0_Box__root wds_1_182_0_Box---direction-10-horizontal" style="--wds_1_182_0_Box-gap:6px;flex-wrap:wrap"><div class="wds_1_182_0_Box__root wds_1_182_0_Box---direction-10-horizontal" style="--wds_1_182_0_Box-gap:0;column-gap:6px;row-gap:8px;flex-wrap:wrap"><a data-hook="category-tag-button-ecommerce" style="outline:1px solid #116DFF" data-size="tiny" data-priority="secondary" class="wds_1_182_0_ButtonCore__root wds_1_182_0_Focusable__root wds_1_182_0_Button__root wds_1_182_0_Button---skin-8-standard wds_1_182_0_Button---priority-9-secondary wds_1_182_0_Button---size-4-tiny" type="button" href="https://es.wix.com/app-market/category/ecommerce" tabindex="0"><span class="wds_1_182_0_ButtonCore__content">Ventas online</span></a><a data-hook="subcategory-tag-button-accounting" style="outline:1px solid  #116DFF" data-size="tiny" data-priority="secondary" class="wds_1_182_0_ButtonCore__root wds_1_182_0_Focusable__root wds_1_182_0_Button__root wds_1_182_0_Button---skin-8-standard wds_1_182_0_Button---priority-9-secondary wds_1_182_0_Button---size-4-tiny" type="button" href="https://es.wix.com/app-market/category/ecommerce/accounting?subCat=accounting" tabindex="0"><span class="wds_1_182_0_ButtonCore__content">Contabilidad</span></a></div></div>


Now take also a look at this other app page

https://www.wix.com/app-market/web-solution/google-ads-shopping

In the HTML code, you will find this 


<div data-hook="categories-tags" class="wds_1_182_0_Box__root wds_1_182_0_Box---direction-10-horizontal" style="--wds_1_182_0_Box-gap: 6px; flex-wrap: wrap;"><div class="wds_1_182_0_Box__root wds_1_182_0_Box---direction-10-horizontal" style="--wds_1_182_0_Box-gap: 0; gap: 8px 6px; flex-wrap: wrap;"><a data-hook="category-tag-button-marketing" data-size="tiny" data-priority="secondary" class="wds_1_182_0_ButtonCore__root wds_1_182_0_Focusable__root wds_1_182_0_Button__root wds_1_182_0_Button---skin-8-standard wds_1_182_0_Button---priority-9-secondary wds_1_182_0_Button---size-4-tiny" type="button" href="https://www.wix.com/app-market/category/marketing" tabindex="0" style="outline: rgb(17, 109, 255) solid 1px;"><span class="wds_1_182_0_ButtonCore__content">Marketing</span></a><a data-hook="subcategory-tag-button-ads" data-size="tiny" data-priority="secondary" class="wds_1_182_0_ButtonCore__root wds_1_182_0_Focusable__root wds_1_182_0_Button__root wds_1_182_0_Button---skin-8-standard wds_1_182_0_Button---priority-9-secondary wds_1_182_0_Button---size-4-tiny" type="button" href="https://www.wix.com/app-market/category/marketing/ads?subCat=ads" tabindex="0" style="outline: rgb(17, 109, 255) solid 1px;"><span class="wds_1_182_0_ButtonCore__content">Ads</span></a></div></div>


So, guess the pattern and write a plan on how we can add this functionality to add these subcategories  to our scraping. 

