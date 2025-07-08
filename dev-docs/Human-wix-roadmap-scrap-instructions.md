This is not really scraping since it's already JSON.

Or rather an easy one. 

Those are the requests from users, both pending votes, fullfiled

We are doing the scraping to later analyze the data and look for opportunities.

As explained above. 

## Urls

### All statuses, page 1, limit 500

[https://support.wix.com/en/api/article/search?locale=en&text=+&resolutions[]=110&resolutions[]=111&resolutions[]=112&resolutions[]=114&resolutions[]=115&resolutions[]=116&pageSize=500&page=1&hasAnyOfLabelIds[]=](https://support.wix.com/en/api/article/search?locale=en&text=+&resolutions%5B%5D=110&resolutions%5B%5D=111&resolutions%5B%5D=112&resolutions%5B%5D=114&resolutions%5B%5D=115&resolutions%5B%5D=116&pageSize=500&page=1&hasAnyOfLabelIds%5B%5D=ed58a591-473a-4294-b53b-03c8b48fe2ad&hasAnyOfLabelIds%5B%5D=a1be0e06-d499-4fa0-8a11-6082ced19dfc&hasAnyOfLabelIds%5B%5D=cc1d7a25-883f-4873-9385-10a995bbe031&hasAnyOfLabelIds%5B%5D=bdd9bc19-adf4-4a21-886e-4f8ac6770343&hasAnyOfLabelIds%5B%5D=ed33803d-1aef-44ff-a154-abd144970fa0&hasAnyOfLabelIds%5B%5D=ec6c20e3-45bf-4401-9612-88e990809539&hasAnyOfLabelIds%5B%5D=2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff&hasAnyOfLabelIds%5B%5D=b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d&hasAnyOfLabelIds%5B%5D=8421ac87-c952-4dea-9f14-36608336c83c&hasAnyOfLabelIds%5B%5D=d10eb0a1-6c3d-414b-94bc-d0af1a3d2823&hasAnyOfLabelIds%5B%5D=54a77da3-5925-4629-b257-c2667909bc9e&hasAnyOfLabelIds%5B%5D=c1a01f37-5a55-4f15-aae8-19771f495b72&hasAnyOfLabelIds%5B%5D=959af218-28f7-4846-b300-982070dd96cb&hasAnyOfLabelIds%5B%5D=a9226a24-6385-4f67-9da5-8a78dd0fa355&hasAnyOfLabelIds%5B%5D=d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56&hasAnyOfLabelIds%5B%5D=a76cff4c-9249-4974-b031-7f6e20b01668&hasAnyOfLabelIds%5B%5D=2db5aad5-5f44-4daa-91e1-c5557feef594&hasAnyOfLabelIds%5B%5D=a8af7a11-a6da-477c-aec0-ebd95d8c4422&hasAnyOfLabelIds%5B%5D=afc7d760-3152-451d-8b61-512807611e9c&hasAnyOfLabelIds%5B%5D=166a0327-f9e9-414d-93f2-59e778c5f44e&hasAnyOfLabelIds%5B%5D=36db0d65-94e5-4f70-be67-89d9c6ab8a1d&hasAnyOfLabelIds%5B%5D=452aeb32-af03-43ac-bdb3-c39c694274a2&hasAnyOfLabelIds%5B%5D=7fe99482-c2f9-4c2c-9f86-8139193f4040&hasAnyOfLabelIds%5B%5D=a49d0133-6e4e-47bf-bf7f-e88d86b23025&hasAnyOfLabelIds%5B%5D=5dd6e5dd-280c-4721-af44-10282b0e92d0&hasAnyOfLabelIds%5B%5D=59f7d2fa-dcfd-4559-80d6-45973ed09920&hasAnyOfLabelIds%5B%5D=400968da-c390-4e32-9f78-94874c633761&hasAnyOfLabelIds%5B%5D=18d84448-9998-4590-a9d8-098a8678b9a4&hasAnyOfLabelIds%5B%5D=d9bd9e0a-7162-4141-8eba-3ae6c8611ff2&hasAnyOfLabelIds%5B%5D=d23404df-b5ac-4bbc-a374-851969c44701&hasAnyOfLabelIds%5B%5D=49709af1-f105-48ee-8c0b-63c811a79ee9&hasAnyOfLabelIds%5B%5D=288f0de3-9002-4b7a-904d-3c86a74d3410&hasAnyOfLabelIds%5B%5D=dc7aa194-680b-452b-b36b-2abac9913fb5&hasAnyOfLabelIds%5B%5D=10f83b99-80ee-42a4-80b6-ac3c32d26d6f&hasAnyOfLabelIds%5B%5D=21822a5d-3ab4-4a73-9f7d-ac5aace55f6e&hasAnyOfLabelIds%5B%5D=c9a46fd8-6919-4969-a26c-dc03f5c60e25&hasAnyOfLabelIds%5B%5D=ca8c47bc-ff69-4006-a0b7-b524906ecabe&hasAnyOfLabelIds%5B%5D=81b4d148-8260-49aa-815c-fa4b45ca70a0&hasAnyOfLabelIds%5B%5D=5e2c392b-8762-4d09-8a0d-121de62d37d8&hasAnyOfLabelIds%5B%5D=bb63fb95-07a9-44f8-a364-8b05635be4b1&hasAnyOfLabelIds%5B%5D=9d4aab81-bd60-4280-9ba2-1e9127156293&hasAnyOfLabelIds%5B%5D=0507df36-ff6c-462b-a995-15807207d5dc&hasAnyOfLabelIds%5B%5D=54726eb7-3c36-4a2c-a549-5532c8e461cd&hasAnyOfLabelIds%5B%5D=487ce0a0-ed15-4714-8bb2-a5098f4270d1&hasAnyOfLabelIds%5B%5D=7b4f5f54-9405-4f8b-a41e-512eefb7d583&hasAnyOfLabelIds%5B%5D=cac1146c-705c-41c9-ac06-66d0941f7e4c&hasAnyOfLabelIds%5B%5D=caebce05-1dc1-4821-9244-e18f092b5e3f&hasAnyOfLabelIds%5B%5D=75fe84b6-42b7-42f5-9c72-240c5ef6615b&hasAnyOfLabelIds%5B%5D=bf421dd9-1590-480e-9a5a-6c1b3929fbe8&hasAnyOfLabelIds%5B%5D=935f8289-3baa-4ec9-b7bb-1c78b2408fab&hasAnyOfLabelIds%5B%5D=ed9e1392-735e-4bdb-beb4-0952dd3a971a&hasAnyOfLabelIds%5B%5D=b598380d-ddb1-46b2-b1b3-a86d8664b536&hasAnyOfLabelIds%5B%5D=2aca7691-dfeb-4c68-962c-adb5132af195&hasAnyOfLabelIds%5B%5D=6a781bfb-2d86-4923-98e2-a8ae333ddb4f&hasAnyOfLabelIds%5B%5D=d6dd504d-fd50-436a-af68-16b9e9477374&hasAnyOfLabelIds%5B%5D=e0eaa21e-c164-4cc4-9f6d-123542dd70e5&hasAnyOfLabelIds%5B%5D=b2cd4c53-c6c8-4287-865c-2187eb527871&hasAnyOfLabelIds%5B%5D=0ac920ef-12a3-45b2-b023-29e9e24d2135&statuses%5B%5D=10&statuses%5B%5D=0&useVespa=false)d6dd504d-fd50-436a-af68-16b9e9477374[&useVespa=false](https://support.wix.com/en/api/article/search?locale=en&text=+&resolutions%5B%5D=110&resolutions%5B%5D=111&resolutions%5B%5D=112&resolutions%5B%5D=114&resolutions%5B%5D=115&resolutions%5B%5D=116&pageSize=500&page=1&hasAnyOfLabelIds%5B%5D=ed58a591-473a-4294-b53b-03c8b48fe2ad&hasAnyOfLabelIds%5B%5D=a1be0e06-d499-4fa0-8a11-6082ced19dfc&hasAnyOfLabelIds%5B%5D=cc1d7a25-883f-4873-9385-10a995bbe031&hasAnyOfLabelIds%5B%5D=bdd9bc19-adf4-4a21-886e-4f8ac6770343&hasAnyOfLabelIds%5B%5D=ed33803d-1aef-44ff-a154-abd144970fa0&hasAnyOfLabelIds%5B%5D=ec6c20e3-45bf-4401-9612-88e990809539&hasAnyOfLabelIds%5B%5D=2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff&hasAnyOfLabelIds%5B%5D=b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d&hasAnyOfLabelIds%5B%5D=8421ac87-c952-4dea-9f14-36608336c83c&hasAnyOfLabelIds%5B%5D=d10eb0a1-6c3d-414b-94bc-d0af1a3d2823&hasAnyOfLabelIds%5B%5D=54a77da3-5925-4629-b257-c2667909bc9e&hasAnyOfLabelIds%5B%5D=c1a01f37-5a55-4f15-aae8-19771f495b72&hasAnyOfLabelIds%5B%5D=959af218-28f7-4846-b300-982070dd96cb&hasAnyOfLabelIds%5B%5D=a9226a24-6385-4f67-9da5-8a78dd0fa355&hasAnyOfLabelIds%5B%5D=d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56&hasAnyOfLabelIds%5B%5D=a76cff4c-9249-4974-b031-7f6e20b01668&hasAnyOfLabelIds%5B%5D=2db5aad5-5f44-4daa-91e1-c5557feef594&hasAnyOfLabelIds%5B%5D=a8af7a11-a6da-477c-aec0-ebd95d8c4422&hasAnyOfLabelIds%5B%5D=afc7d760-3152-451d-8b61-512807611e9c&hasAnyOfLabelIds%5B%5D=166a0327-f9e9-414d-93f2-59e778c5f44e&hasAnyOfLabelIds%5B%5D=36db0d65-94e5-4f70-be67-89d9c6ab8a1d&hasAnyOfLabelIds%5B%5D=452aeb32-af03-43ac-bdb3-c39c694274a2&hasAnyOfLabelIds%5B%5D=7fe99482-c2f9-4c2c-9f86-8139193f4040&hasAnyOfLabelIds%5B%5D=a49d0133-6e4e-47bf-bf7f-e88d86b23025&hasAnyOfLabelIds%5B%5D=5dd6e5dd-280c-4721-af44-10282b0e92d0&hasAnyOfLabelIds%5B%5D=59f7d2fa-dcfd-4559-80d6-45973ed09920&hasAnyOfLabelIds%5B%5D=400968da-c390-4e32-9f78-94874c633761&hasAnyOfLabelIds%5B%5D=18d84448-9998-4590-a9d8-098a8678b9a4&hasAnyOfLabelIds%5B%5D=d9bd9e0a-7162-4141-8eba-3ae6c8611ff2&hasAnyOfLabelIds%5B%5D=d23404df-b5ac-4bbc-a374-851969c44701&hasAnyOfLabelIds%5B%5D=49709af1-f105-48ee-8c0b-63c811a79ee9&hasAnyOfLabelIds%5B%5D=288f0de3-9002-4b7a-904d-3c86a74d3410&hasAnyOfLabelIds%5B%5D=dc7aa194-680b-452b-b36b-2abac9913fb5&hasAnyOfLabelIds%5B%5D=10f83b99-80ee-42a4-80b6-ac3c32d26d6f&hasAnyOfLabelIds%5B%5D=21822a5d-3ab4-4a73-9f7d-ac5aace55f6e&hasAnyOfLabelIds%5B%5D=c9a46fd8-6919-4969-a26c-dc03f5c60e25&hasAnyOfLabelIds%5B%5D=ca8c47bc-ff69-4006-a0b7-b524906ecabe&hasAnyOfLabelIds%5B%5D=81b4d148-8260-49aa-815c-fa4b45ca70a0&hasAnyOfLabelIds%5B%5D=5e2c392b-8762-4d09-8a0d-121de62d37d8&hasAnyOfLabelIds%5B%5D=bb63fb95-07a9-44f8-a364-8b05635be4b1&hasAnyOfLabelIds%5B%5D=9d4aab81-bd60-4280-9ba2-1e9127156293&hasAnyOfLabelIds%5B%5D=0507df36-ff6c-462b-a995-15807207d5dc&hasAnyOfLabelIds%5B%5D=54726eb7-3c36-4a2c-a549-5532c8e461cd&hasAnyOfLabelIds%5B%5D=487ce0a0-ed15-4714-8bb2-a5098f4270d1&hasAnyOfLabelIds%5B%5D=7b4f5f54-9405-4f8b-a41e-512eefb7d583&hasAnyOfLabelIds%5B%5D=cac1146c-705c-41c9-ac06-66d0941f7e4c&hasAnyOfLabelIds%5B%5D=caebce05-1dc1-4821-9244-e18f092b5e3f&hasAnyOfLabelIds%5B%5D=75fe84b6-42b7-42f5-9c72-240c5ef6615b&hasAnyOfLabelIds%5B%5D=bf421dd9-1590-480e-9a5a-6c1b3929fbe8&hasAnyOfLabelIds%5B%5D=935f8289-3baa-4ec9-b7bb-1c78b2408fab&hasAnyOfLabelIds%5B%5D=ed9e1392-735e-4bdb-beb4-0952dd3a971a&hasAnyOfLabelIds%5B%5D=b598380d-ddb1-46b2-b1b3-a86d8664b536&hasAnyOfLabelIds%5B%5D=2aca7691-dfeb-4c68-962c-adb5132af195&hasAnyOfLabelIds%5B%5D=6a781bfb-2d86-4923-98e2-a8ae333ddb4f&hasAnyOfLabelIds%5B%5D=d6dd504d-fd50-436a-af68-16b9e9477374&hasAnyOfLabelIds%5B%5D=e0eaa21e-c164-4cc4-9f6d-123542dd70e5&hasAnyOfLabelIds%5B%5D=b2cd4c53-c6c8-4287-865c-2187eb527871&hasAnyOfLabelIds%5B%5D=0ac920ef-12a3-45b2-b023-29e9e24d2135&statuses%5B%5D=10&statuses%5B%5D=0&useVespa=false)

[&statuses[]=10&statuses[]=0](https://support.wix.com/en/api/article/search?locale=en&text=+&resolutions%5B%5D=110&resolutions%5B%5D=111&resolutions%5B%5D=112&resolutions%5B%5D=114&resolutions%5B%5D=115&resolutions%5B%5D=116&pageSize=500&page=1&hasAnyOfLabelIds%5B%5D=ed58a591-473a-4294-b53b-03c8b48fe2ad&hasAnyOfLabelIds%5B%5D=a1be0e06-d499-4fa0-8a11-6082ced19dfc&hasAnyOfLabelIds%5B%5D=cc1d7a25-883f-4873-9385-10a995bbe031&hasAnyOfLabelIds%5B%5D=bdd9bc19-adf4-4a21-886e-4f8ac6770343&hasAnyOfLabelIds%5B%5D=ed33803d-1aef-44ff-a154-abd144970fa0&hasAnyOfLabelIds%5B%5D=ec6c20e3-45bf-4401-9612-88e990809539&hasAnyOfLabelIds%5B%5D=2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff&hasAnyOfLabelIds%5B%5D=b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d&hasAnyOfLabelIds%5B%5D=8421ac87-c952-4dea-9f14-36608336c83c&hasAnyOfLabelIds%5B%5D=d10eb0a1-6c3d-414b-94bc-d0af1a3d2823&hasAnyOfLabelIds%5B%5D=54a77da3-5925-4629-b257-c2667909bc9e&hasAnyOfLabelIds%5B%5D=c1a01f37-5a55-4f15-aae8-19771f495b72&hasAnyOfLabelIds%5B%5D=959af218-28f7-4846-b300-982070dd96cb&hasAnyOfLabelIds%5B%5D=a9226a24-6385-4f67-9da5-8a78dd0fa355&hasAnyOfLabelIds%5B%5D=d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56&hasAnyOfLabelIds%5B%5D=a76cff4c-9249-4974-b031-7f6e20b01668&hasAnyOfLabelIds%5B%5D=2db5aad5-5f44-4daa-91e1-c5557feef594&hasAnyOfLabelIds%5B%5D=a8af7a11-a6da-477c-aec0-ebd95d8c4422&hasAnyOfLabelIds%5B%5D=afc7d760-3152-451d-8b61-512807611e9c&hasAnyOfLabelIds%5B%5D=166a0327-f9e9-414d-93f2-59e778c5f44e&hasAnyOfLabelIds%5B%5D=36db0d65-94e5-4f70-be67-89d9c6ab8a1d&hasAnyOfLabelIds%5B%5D=452aeb32-af03-43ac-bdb3-c39c694274a2&hasAnyOfLabelIds%5B%5D=7fe99482-c2f9-4c2c-9f86-8139193f4040&hasAnyOfLabelIds%5B%5D=a49d0133-6e4e-47bf-bf7f-e88d86b23025&hasAnyOfLabelIds%5B%5D=5dd6e5dd-280c-4721-af44-10282b0e92d0&hasAnyOfLabelIds%5B%5D=59f7d2fa-dcfd-4559-80d6-45973ed09920&hasAnyOfLabelIds%5B%5D=400968da-c390-4e32-9f78-94874c633761&hasAnyOfLabelIds%5B%5D=18d84448-9998-4590-a9d8-098a8678b9a4&hasAnyOfLabelIds%5B%5D=d9bd9e0a-7162-4141-8eba-3ae6c8611ff2&hasAnyOfLabelIds%5B%5D=d23404df-b5ac-4bbc-a374-851969c44701&hasAnyOfLabelIds%5B%5D=49709af1-f105-48ee-8c0b-63c811a79ee9&hasAnyOfLabelIds%5B%5D=288f0de3-9002-4b7a-904d-3c86a74d3410&hasAnyOfLabelIds%5B%5D=dc7aa194-680b-452b-b36b-2abac9913fb5&hasAnyOfLabelIds%5B%5D=10f83b99-80ee-42a4-80b6-ac3c32d26d6f&hasAnyOfLabelIds%5B%5D=21822a5d-3ab4-4a73-9f7d-ac5aace55f6e&hasAnyOfLabelIds%5B%5D=c9a46fd8-6919-4969-a26c-dc03f5c60e25&hasAnyOfLabelIds%5B%5D=ca8c47bc-ff69-4006-a0b7-b524906ecabe&hasAnyOfLabelIds%5B%5D=81b4d148-8260-49aa-815c-fa4b45ca70a0&hasAnyOfLabelIds%5B%5D=5e2c392b-8762-4d09-8a0d-121de62d37d8&hasAnyOfLabelIds%5B%5D=bb63fb95-07a9-44f8-a364-8b05635be4b1&hasAnyOfLabelIds%5B%5D=9d4aab81-bd60-4280-9ba2-1e9127156293&hasAnyOfLabelIds%5B%5D=0507df36-ff6c-462b-a995-15807207d5dc&hasAnyOfLabelIds%5B%5D=54726eb7-3c36-4a2c-a549-5532c8e461cd&hasAnyOfLabelIds%5B%5D=487ce0a0-ed15-4714-8bb2-a5098f4270d1&hasAnyOfLabelIds%5B%5D=7b4f5f54-9405-4f8b-a41e-512eefb7d583&hasAnyOfLabelIds%5B%5D=cac1146c-705c-41c9-ac06-66d0941f7e4c&hasAnyOfLabelIds%5B%5D=caebce05-1dc1-4821-9244-e18f092b5e3f&hasAnyOfLabelIds%5B%5D=75fe84b6-42b7-42f5-9c72-240c5ef6615b&hasAnyOfLabelIds%5B%5D=bf421dd9-1590-480e-9a5a-6c1b3929fbe8&hasAnyOfLabelIds%5B%5D=935f8289-3baa-4ec9-b7bb-1c78b2408fab&hasAnyOfLabelIds%5B%5D=ed9e1392-735e-4bdb-beb4-0952dd3a971a&hasAnyOfLabelIds%5B%5D=b598380d-ddb1-46b2-b1b3-a86d8664b536&hasAnyOfLabelIds%5B%5D=2aca7691-dfeb-4c68-962c-adb5132af195&hasAnyOfLabelIds%5B%5D=6a781bfb-2d86-4923-98e2-a8ae333ddb4f&hasAnyOfLabelIds%5B%5D=d6dd504d-fd50-436a-af68-16b9e9477374&hasAnyOfLabelIds%5B%5D=e0eaa21e-c164-4cc4-9f6d-123542dd70e5&hasAnyOfLabelIds%5B%5D=b2cd4c53-c6c8-4287-865c-2187eb527871&hasAnyOfLabelIds%5B%5D=0ac920ef-12a3-45b2-b023-29e9e24d2135&statuses%5B%5D=10&statuses%5B%5D=0&useVespa=false)

### Url params (get)

- locale : “en”
- text : “+”
- resolutions[] : must be set to all in this form : [resolutions[]=110&resolutions[]=111&resolutions[]=112&resolutions[]=114&resolutions[]=115&resolutions[]=116](https://support.wix.com/en/api/article/search?locale=en&text=+&resolutions%5B%5D=110&resolutions%5B%5D=111&resolutions%5B%5D=112&resolutions%5B%5D=114&resolutions%5B%5D=115&resolutions%5B%5D=116&pageSize=500&page=1&hasAnyOfLabelIds%5B%5D=ed58a591-473a-4294-b53b-03c8b48fe2ad&hasAnyOfLabelIds%5B%5D=a1be0e06-d499-4fa0-8a11-6082ced19dfc&hasAnyOfLabelIds%5B%5D=cc1d7a25-883f-4873-9385-10a995bbe031&hasAnyOfLabelIds%5B%5D=bdd9bc19-adf4-4a21-886e-4f8ac6770343&hasAnyOfLabelIds%5B%5D=ed33803d-1aef-44ff-a154-abd144970fa0&hasAnyOfLabelIds%5B%5D=ec6c20e3-45bf-4401-9612-88e990809539&hasAnyOfLabelIds%5B%5D=2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff&hasAnyOfLabelIds%5B%5D=b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d&hasAnyOfLabelIds%5B%5D=8421ac87-c952-4dea-9f14-36608336c83c&hasAnyOfLabelIds%5B%5D=d10eb0a1-6c3d-414b-94bc-d0af1a3d2823&hasAnyOfLabelIds%5B%5D=54a77da3-5925-4629-b257-c2667909bc9e&hasAnyOfLabelIds%5B%5D=c1a01f37-5a55-4f15-aae8-19771f495b72&hasAnyOfLabelIds%5B%5D=959af218-28f7-4846-b300-982070dd96cb&hasAnyOfLabelIds%5B%5D=a9226a24-6385-4f67-9da5-8a78dd0fa355&hasAnyOfLabelIds%5B%5D=d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56&hasAnyOfLabelIds%5B%5D=a76cff4c-9249-4974-b031-7f6e20b01668&hasAnyOfLabelIds%5B%5D=2db5aad5-5f44-4daa-91e1-c5557feef594&hasAnyOfLabelIds%5B%5D=a8af7a11-a6da-477c-aec0-ebd95d8c4422&hasAnyOfLabelIds%5B%5D=afc7d760-3152-451d-8b61-512807611e9c&hasAnyOfLabelIds%5B%5D=166a0327-f9e9-414d-93f2-59e778c5f44e&hasAnyOfLabelIds%5B%5D=36db0d65-94e5-4f70-be67-89d9c6ab8a1d&hasAnyOfLabelIds%5B%5D=452aeb32-af03-43ac-bdb3-c39c694274a2&hasAnyOfLabelIds%5B%5D=7fe99482-c2f9-4c2c-9f86-8139193f4040&hasAnyOfLabelIds%5B%5D=a49d0133-6e4e-47bf-bf7f-e88d86b23025&hasAnyOfLabelIds%5B%5D=5dd6e5dd-280c-4721-af44-10282b0e92d0&hasAnyOfLabelIds%5B%5D=59f7d2fa-dcfd-4559-80d6-45973ed09920&hasAnyOfLabelIds%5B%5D=400968da-c390-4e32-9f78-94874c633761&hasAnyOfLabelIds%5B%5D=18d84448-9998-4590-a9d8-098a8678b9a4&hasAnyOfLabelIds%5B%5D=d9bd9e0a-7162-4141-8eba-3ae6c8611ff2&hasAnyOfLabelIds%5B%5D=d23404df-b5ac-4bbc-a374-851969c44701&hasAnyOfLabelIds%5B%5D=49709af1-f105-48ee-8c0b-63c811a79ee9&hasAnyOfLabelIds%5B%5D=288f0de3-9002-4b7a-904d-3c86a74d3410&hasAnyOfLabelIds%5B%5D=dc7aa194-680b-452b-b36b-2abac9913fb5&hasAnyOfLabelIds%5B%5D=10f83b99-80ee-42a4-80b6-ac3c32d26d6f&hasAnyOfLabelIds%5B%5D=21822a5d-3ab4-4a73-9f7d-ac5aace55f6e&hasAnyOfLabelIds%5B%5D=c9a46fd8-6919-4969-a26c-dc03f5c60e25&hasAnyOfLabelIds%5B%5D=ca8c47bc-ff69-4006-a0b7-b524906ecabe&hasAnyOfLabelIds%5B%5D=81b4d148-8260-49aa-815c-fa4b45ca70a0&hasAnyOfLabelIds%5B%5D=5e2c392b-8762-4d09-8a0d-121de62d37d8&hasAnyOfLabelIds%5B%5D=bb63fb95-07a9-44f8-a364-8b05635be4b1&hasAnyOfLabelIds%5B%5D=9d4aab81-bd60-4280-9ba2-1e9127156293&hasAnyOfLabelIds%5B%5D=0507df36-ff6c-462b-a995-15807207d5dc&hasAnyOfLabelIds%5B%5D=54726eb7-3c36-4a2c-a549-5532c8e461cd&hasAnyOfLabelIds%5B%5D=487ce0a0-ed15-4714-8bb2-a5098f4270d1&hasAnyOfLabelIds%5B%5D=7b4f5f54-9405-4f8b-a41e-512eefb7d583&hasAnyOfLabelIds%5B%5D=cac1146c-705c-41c9-ac06-66d0941f7e4c&hasAnyOfLabelIds%5B%5D=caebce05-1dc1-4821-9244-e18f092b5e3f&hasAnyOfLabelIds%5B%5D=75fe84b6-42b7-42f5-9c72-240c5ef6615b&hasAnyOfLabelIds%5B%5D=bf421dd9-1590-480e-9a5a-6c1b3929fbe8&hasAnyOfLabelIds%5B%5D=935f8289-3baa-4ec9-b7bb-1c78b2408fab&hasAnyOfLabelIds%5B%5D=ed9e1392-735e-4bdb-beb4-0952dd3a971a&hasAnyOfLabelIds%5B%5D=b598380d-ddb1-46b2-b1b3-a86d8664b536&hasAnyOfLabelIds%5B%5D=2aca7691-dfeb-4c68-962c-adb5132af195&hasAnyOfLabelIds%5B%5D=6a781bfb-2d86-4923-98e2-a8ae333ddb4f&hasAnyOfLabelIds%5B%5D=d6dd504d-fd50-436a-af68-16b9e9477374&hasAnyOfLabelIds%5B%5D=e0eaa21e-c164-4cc4-9f6d-123542dd70e5&hasAnyOfLabelIds%5B%5D=b2cd4c53-c6c8-4287-865c-2187eb527871&hasAnyOfLabelIds%5B%5D=0ac920ef-12a3-45b2-b023-29e9e24d2135&statuses%5B%5D=10&statuses%5B%5D=0&useVespa=false)
- AsAnyOfLabellIds[] = label id we want to target. (the idea perhaps, is to target labels ids one by one.)
- PageSize : 500 (max), the number of items we want per page
- page: 1 (2,3,4..) the page we want to retrieve

## Sample result data

`{"items":[{"id":"d7a911a0-df13-4cfa-9d57-9abd6e4dad2b","title":"Wix Stores Request: Quantity-Based Price Discounts","description":"Currently, you can set a single price for each product or variant in Wix Stores. However, it's not possible to create volume discounts that automatically reduce the price when your customers buy more ...","uri":"/article/wix-stores-request-quantity-based-price-discounts","url":"https://support.wix.com/en/article/wix-stores-request-quantity-based-price-discounts","type":110,"categoryId":"bbd9d0bb-21f7-4c06-bcbf-a780eaa9eb3f","labels":[{"id":"b2cd4c53-c6c8-4287-865c-2187eb527871","sortOrder":0}],"resolution":110,"readingTimeInMinutes":1,"creationDate":1749729129000,"docType":"ANSWERS_ARTICLE"},{"id":"e0aabe9c-3ed2-40bd-871b-f30ab83f8430","title":"Wix Blog Request: Restricting Specific Parts of Blog Posts to Members Only","description":"Currently, it is not possible to restrict specific parts of blog posts to members only. For example, adding a 'Log in to continue reading' button prompting members to log in to view the post. However,...","uri":"/article/wix-blog-request-restricting-certain-blog-posts-to-members-only","url":"https://support.wix.com/en/article/wix-blog-request-restricting-certain-blog-posts-to-members-only","type":110,"categoryId":"ef6b5a2c-91f5-48cb-94a0-6b229111bb1d","labels":[{"id":"c9a46fd8-6919-4969-a26c-dc03f5c60e25","sortOrder":0}],"resolution":110,"readingTimeInMinutes":1,"creationDate":1750345418000,"docType":"ANSWERS_ARTICLE"},{"id":"d362c263-8f11-41ac-8f14-e647269804f9","title":"Wix Stores Request: Displaying Each Product Variant Separately","description":"Currently, when you create a product with product options (such as color), they are all displayed as a single product in galleries and the Category page. It's not possible to display each variant (e.g...","uri":"/article/wix-stores-request-displaying-each-product-variant-separately","url":"https://support.wix.com/en/article/wix-stores-request-displaying-each-product-variant-separately","type":110,"categoryId":"bbd9d0bb-21f7-4c06-bcbf-a780eaa9eb3f","labels":[{"id":"b2cd4c53-c6c8-4287-865c-2187eb527871","sortOrder":0}],"resolution":110,"readingTimeInMinutes":1,"creationDate":1749482833000,"docType":"ANSWERS_ARTICLE"},{"id":"c8d8d141-ce78-48bc-9f8f-c2192b565a43","title":"Studio Editor Request: Accessibility Wizard","description":"We are pleased to announce that the Accessibility Wizard is now available in the Studio Editor.","uri":"/article/editor-x-request-accessibility-wizard","url":"https://support.wix.com/en/article/editor-x-request-accessibility-wizard","type":110,"categoryId":"6bfaaccb-bbb0-4d95-880c-b2a9a2c1e9ca","labels":[{"id":"59f7d2fa-dcfd-4559-80d6-45973ed09920","sortOrder":0}],"resolution":116,"readingTimeInMinutes":1,"creationDate":1612282789000,"docType":"ANSWERS_ARTICLE"},{"id":"f5adadc8-bdd0-4335-ab78-dee02645618d","title":"Developer Request: Automating Index Creation","description":"Currently, users need to manually identify slow-running data queries and create indexes to optimize their performance. A feature that would automatically detect slow queries and generate indexes would...","uri":"/article/developer-request-automating-index-creation","url":"https://support.wix.com/en/article/developer-request-automating-index-creation","type":110,"categoryId":"fd726609-fad6-4c11-9f16-d3c4c281146d","labels":[{"id":"b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d","sortOrder":0}],"resolution":112,"readingTimeInMinutes":1,"creationDate":1751369223000,"docType":"ANSWERS_ARTICLE"}],"itemsCount":2033,"searchMethod":"Answers"}`

## Reply Format

(json)

Root
├─ items [Array of Objects]

│   ├─ id: Unique identifier for the item (string, UUID)
│   ├─ title: Title of the article or request (string)
│   ├─ description: Short summary of the article/request (string)
│   ├─ uri: Relative URL path to the article (string)
│   ├─ url: Full URL to the article (string)
│   ├─ type: Numeric code for the item type (number)
│   ├─ categoryId: Unique identifier for the category (string, UUID)
│   ├─ labels [Array of Objects]
│   │   ├─ id: Unique identifier for the label (string, UUID)
│   │   └─ sortOrder: Sorting order of the label (number)
│   ├─ resolution: Numeric code for the resolution status (number)
│   ├─ readingTimeInMinutes: Estimated reading time (number)
│   ├─ creationDate: Creation timestamp in milliseconds since epoch (number)
│   └─ docType: Document type code/name (string)
├─ itemsCount: Total number of items found in the search (number)
└─ searchMethod: Name of the search method used (string)

### Item fields needed

- title
- description
- url
- resolution : mapped
- creation date

## field mapping

### Resolution

type: 110 etc

- 110 : “Collecting votes”
- 111 : “Planned”
- 112: “Working on it”
- 114 : “Pre-launch”
- 116 : “Launched

### LabelIds

- ed58a591-473a-4294-b53b-03c8b48fe2ad  = “Accesibility”
- a1be0e06-d499-4fa0-8a11-6082ced19dfc = “AI tools”
- cc1d7a25-883f-4873-9385-10a995bbe031 = “Billing”
- bdd9bc19-adf4-4a21-886e-4f8ac6770343 = “Business Email”
- ed33803d-1aef-44ff-a154-abd144970fa0 = “CMS”
- ec6c20e3-45bf-4401-9612-88e990809539 = “Contacts”
- 2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff = “Customer Care”
- b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d = “Developer Platform”
- 8421ac87-c952-4dea-9f14-36608336c83c = “Domains”
- d10eb0a1-6c3d-414b-94bc-d0af1a3d2823 = “Email marketing”
- 54a77da3-5925-4629-b257-c2667909bc9e = “FB and insta”
- c1a01f37-5a55-4f15-aae8-19771f495b72 = “Google Ads”
- 959af218-28f7-4846-b300-982070dd96cb = “Inbox”
- a9226a24-6385-4f67-9da5-8a78dd0fa355 = “Marketing Integrations”
- d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56 = “Mobile Appe Builder”
- a76cff4c-9249-4974-b031-7f6e20b01668 = “Payments”
- 2db5aad5-5f44-4daa-91e1-c5557feef594 = “Point of Sale (POS)
- a8af7a11-a6da-477c-aec0-ebd95d8c4422 = “Portfolio”
- afc7d760-3152-451d-8b61-512807611e9c = “Pro gallery”
- 166a0327-f9e9-414d-93f2-59e778c5f44e = “Roles and Access”
- 36db0d65-94e5-4f70-be67-89d9c6ab8a1d = “SEO”
- 452aeb32-af03-43ac-bdb3-c39c694274a2 = “Site Dashboard”
- 7fe99482-c2f9-4c2c-9f86-8139193f4040 = “Site Members”
- a49d0133-6e4e-47bf-bf7f-e88d86b23025 = “Social Media Marketing”
- 5dd6e5dd-280c-4721-af44-10282b0e92d0 = “Spaces by Wix”
- 59f7d2fa-dcfd-4559-80d6-45973ed09920 = “Studio Editor”
- 400968da-c390-4e32-9f78-94874c633761 = “Studio Workspace”
- 18d84448-9998-4590-a9d8-098a8678b9a4 = “Velo”
- d9bd9e0a-7162-4141-8eba-3ae6c8611ff2 = "Wix AI site chat”
- d23404df-b5ac-4bbc-a374-851969c44701 = “Wix Analytics”
- 49709af1-f105-48ee-8c0b-63c811a79ee9 = “Wix App”
- 288f0de3-9002-4b7a-904d-3c86a74d3410 = "Wix App Market”
- dc7aa194-680b-452b-b36b-2abac9913fb5 = “Wix Audio”
- 10f83b99-80ee-42a4-80b6-ac3c32d26d6f = “Wix automations”
- 21822a5d-3ab4-4a73-9f7d-ac5aace55f6e = “Wix Blocks”
- c9a46fd8-6919-4969-a26c-dc03f5c60e25 = “Wix Blog”
- ca8c47bc-ff69-4006-a0b7-b524906ecabe = “Wix Booking”
- 81b4d148-8260-49aa-815c-fa4b45ca70a0 = “Wix Donations”
- 5e2c392b-8762-4d09-8a0d-121de62d37d8 = “Wix Editor”
- bb63fb95-07a9-44f8-a364-8b05635be4b1 = “Wix Events”
- 9d4aab81-bd60-4280-9ba2-1e9127156293 = “Wix Forms”
- 0507df36-ff6c-462b-a995-15807207d5dc = “Wix Functions”
- 54726eb7-3c36-4a2c-a549-5532c8e461cd = “Wix Groups”
- 487ce0a0-ed15-4714-8bb2-a5098f4270d1 = “Wix Headless”
- 7b4f5f54-9405-4f8b-a41e-512eefb7d583 = “WIX hotels”
- cac1146c-705c-41c9-ac06-66d0941f7e4c = “WIX hotels by hotelrunner”
- caebce05-1dc1-4821-9244-e18f092b5e3f = “WIX Invoices & price quotes”
- 75fe84b6-42b7-42f5-9c72-240c5ef6615b = “WIX logo maker”
- bf421dd9-1590-480e-9a5a-6c1b3929fbe8 = “Wix loyalty program”
- 935f8289-3baa-4ec9-b7bb-1c78b2408fab = “Wix Media”
- ed9e1392-735e-4bdb-beb4-0952dd3a971a = “Wix Multilingual”
- b598380d-ddb1-46b2-b1b3-a86d8664b536 = “Wix online programs”
- 2aca7691-dfeb-4c68-962c-adb5132af195 =”Wix Pricing plans”
- 6a781bfb-2d86-4923-98e2-a8ae333ddb4f = “Wix Referral Program”
- d6dd504d-fd50-436a-af68-16b9e9477374 = “Wix restaurants
- e0eaa21e-c164-4cc4-9f6d-123542dd70e5 = “Wix SMS”
- b2cd4c53-c6c8-4287-865c-2187eb527871 = “Wix Stores”
- 0ac920ef-12a3-45b2-b023-29e9e24d2135 = “Wix Video”
-