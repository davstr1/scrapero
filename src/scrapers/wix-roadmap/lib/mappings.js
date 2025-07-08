// Resolution code to name mappings
const RESOLUTION_MAPPINGS = {
  110: "Collecting votes",
  111: "Planned",
  112: "Working on it",
  114: "Pre-launch",
  115: "Rollout in progress",
  116: "Launched"
};

// Label ID to category name mappings
const LABEL_MAPPINGS = {
  "ed58a591-473a-4294-b53b-03c8b48fe2ad": "Accessibility",
  "a1be0e06-d499-4fa0-8a11-6082ced19dfc": "AI tools",
  "cc1d7a25-883f-4873-9385-10a995bbe031": "Billing",
  "bdd9bc19-adf4-4a21-886e-4f8ac6770343": "Business Email",
  "ed33803d-1aef-44ff-a154-abd144970fa0": "CMS",
  "ec6c20e3-45bf-4401-9612-88e990809539": "Contacts",
  "2d9552fc-d4d4-4ab1-8f4e-12ed5a552aff": "Customer Care",
  "b3ec01d1-a4a7-402d-a4df-7c7f3347fc5d": "Developer Platform",
  "8421ac87-c952-4dea-9f14-36608336c83c": "Domains",
  "d10eb0a1-6c3d-414b-94bc-d0af1a3d2823": "Email marketing",
  "54a77da3-5925-4629-b257-c2667909bc9e": "FB and insta",
  "c1a01f37-5a55-4f15-aae8-19771f495b72": "Google Ads",
  "959af218-28f7-4846-b300-982070dd96cb": "Inbox",
  "a9226a24-6385-4f67-9da5-8a78dd0fa355": "Marketing Integrations",
  "d7cd78f9-55ff-4c71-b7ae-9544b6e9bd56": "Mobile App Builder",
  "a76cff4c-9249-4974-b031-7f6e20b01668": "Payments",
  "2db5aad5-5f44-4daa-91e1-c5557feef594": "Point of Sale (POS)",
  "a8af7a11-a6da-477c-aec0-ebd95d8c4422": "Portfolio",
  "afc7d760-3152-451d-8b61-512807611e9c": "Pro gallery",
  "166a0327-f9e9-414d-93f2-59e778c5f44e": "Roles and Access",
  "36db0d65-94e5-4f70-be67-89d9c6ab8a1d": "SEO",
  "452aeb32-af03-43ac-bdb3-c39c694274a2": "Site Dashboard",
  "7fe99482-c2f9-4c2c-9f86-8139193f4040": "Site Members",
  "a49d0133-6e4e-47bf-bf7f-e88d86b23025": "Social Media Marketing",
  "5dd6e5dd-280c-4721-af44-10282b0e92d0": "Spaces by Wix",
  "59f7d2fa-dcfd-4559-80d6-45973ed09920": "Studio Editor",
  "400968da-c390-4e32-9f78-94874c633761": "Studio Workspace",
  "18d84448-9998-4590-a9d8-098a8678b9a4": "Velo",
  "d9bd9e0a-7162-4141-8eba-3ae6c8611ff2": "Wix AI site chat",
  "d23404df-b5ac-4bbc-a374-851969c44701": "Wix Analytics",
  "49709af1-f105-48ee-8c0b-63c811a79ee9": "Wix App",
  "288f0de3-9002-4b7a-904d-3c86a74d3410": "Wix App Market",
  "dc7aa194-680b-452b-b36b-2abac9913fb5": "Wix Audio",
  "10f83b99-80ee-42a4-80b6-ac3c32d26d6f": "Wix automations",
  "21822a5d-3ab4-4a73-9f7d-ac5aace55f6e": "Wix Blocks",
  "c9a46fd8-6919-4969-a26c-dc03f5c60e25": "Wix Blog",
  "ca8c47bc-ff69-4006-a0b7-b524906ecabe": "Wix Booking",
  "81b4d148-8260-49aa-815c-fa4b45ca70a0": "Wix Donations",
  "5e2c392b-8762-4d09-8a0d-121de62d37d8": "Wix Editor",
  "bb63fb95-07a9-44f8-a364-8b05635be4b1": "Wix Events",
  "9d4aab81-bd60-4280-9ba2-1e9127156293": "Wix Forms",
  "0507df36-ff6c-462b-a995-15807207d5dc": "Wix Functions",
  "54726eb7-3c36-4a2c-a549-5532c8e461cd": "Wix Groups",
  "487ce0a0-ed15-4714-8bb2-a5098f4270d1": "Wix Headless",
  "7b4f5f54-9405-4f8b-a41e-512eefb7d583": "WIX hotels",
  "cac1146c-705c-41c9-ac06-66d0941f7e4c": "WIX hotels by hotelrunner",
  "caebce05-1dc1-4821-9244-e18f092b5e3f": "WIX Invoices & price quotes",
  "75fe84b6-42b7-42f5-9c72-240c5ef6615b": "WIX logo maker",
  "bf421dd9-1590-480e-9a5a-6c1b3929fbe8": "Wix loyalty program",
  "935f8289-3baa-4ec9-b7bb-1c78b2408fab": "Wix Media",
  "ed9e1392-735e-4bdb-beb4-0952dd3a971a": "Wix Multilingual",
  "b598380d-ddb1-46b2-b1b3-a86d8664b536": "Wix online programs",
  "2aca7691-dfeb-4c68-962c-adb5132af195": "Wix Pricing plans",
  "6a781bfb-2d86-4923-98e2-a8ae333ddb4f": "Wix Referral Program",
  "d6dd504d-fd50-436a-af68-16b9e9477374": "Wix restaurants",
  "e0eaa21e-c164-4cc4-9f6d-123542dd70e5": "Wix SMS",
  "b2cd4c53-c6c8-4287-865c-2187eb527871": "Wix Stores",
  "0ac920ef-12a3-45b2-b023-29e9e24d2135": "Wix Video"
};

// Helper function to get resolution name from code
function getResolutionName(code) {
  return RESOLUTION_MAPPINGS[code] || `Unknown (${code})`;
}

// Helper function to get category names from label IDs
function getCategoryNames(labelIds) {
  if (!Array.isArray(labelIds)) return [];
  
  return labelIds.map(labelId => {
    const id = typeof labelId === 'object' ? labelId.id : labelId;
    return LABEL_MAPPINGS[id] || `Unknown (${id})`;
  });
}

// Get all label IDs as an array
function getAllLabelIds() {
  return Object.keys(LABEL_MAPPINGS);
}

module.exports = {
  RESOLUTION_MAPPINGS,
  LABEL_MAPPINGS,
  getResolutionName,
  getCategoryNames,
  getAllLabelIds
};