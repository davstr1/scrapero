We're going to build a new WordPress scraper. 
This time we are going to scrape all the plugins 
The process is a little bit distinct. 
First, we need to download this very large file. 
https://plugins.svn.wordpress.org/
This is done once while Because the file is very large. 
Then we should probably extract all the URLs from these files that are not URLs, that are slugs, into some kind of CSV file. 
Why? Because those slugs will lead you to actual WordPress plugin pages. 

https://plugins.svn.wordpress.org/[plugin-slug]/ -> https://wordpress.org/plugins/[plugin-slug]/

Once this is done, we just need to parse this new CSV file and complete it with the results from scraping the actual plugins. 
You will first need to open some plugin pages to check data format. 
And actually built the scrapers, selectors, and the CSV, and the resulting CSV fields from there. 
You can do that by consulting our current export CSV file. Well, only consult the URL field here. 
Because the other fields have to be reconstructed from the actual plugins page Like now, where we had some of this data from the listing pages. But we don't need to access those right now. 

The settings of this scraper must be quite aggressive because there is like 60k plugins to scrape. 
We will use a proxy available at this exact address.  http://sxbrfiav:z1rnitsp7b1x@82.25.216.29:6871/
Don't try to reverse or modify this address. Use this exact address as the proxy address is a rotating proxy 