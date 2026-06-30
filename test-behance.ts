const url = 'https://www.behance.net/gallery/251665957/Social-Media-Posts';

async function fetchMetadata() {
  const response2 = await fetch('https://www.behance.net/oembed?url=' + url);
  const text2 = await response2.text();
  const matches = text2.match(/https:\\?\/\\?\/mir-s3-cdn-cf\.behance\.net[^"'\s]+/g) || [];
  
  const modules = matches.filter(m => m.includes('project_modules'));
  console.log("Modules found:", modules.slice(0, 10));
}

fetchMetadata();
