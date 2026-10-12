import { i as __exportAll, n as renderScript, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { _ as addAttribute, c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
import { t as getCollection } from "./_astro_content_CRZlW3N8.mjs";
//#region src/pages/work.astro
var work_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Work,
	file: () => $$file,
	url: () => $$url
});
var $$Work = createComponent(async ($$result, $$props, $$slots) => {
	const artworks = await getCollection("artworks");
	const base = "/sarah-blachly-art";
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "Work",
		"description": "Browse Sarah Blachly's artwork by series.",
		"data-astro-cid-r3bc3sjw": true
	}, { "default": ($$result) => renderTemplate`<link rel="stylesheet" href="https://unpkg.com/photoswipe@5/dist/photoswipe.css">${maybeRenderHead($$result)}<section class="fade-in" style="padding: 3rem 0;" data-astro-cid-r3bc3sjw><h1 style="text-align:center;" data-astro-cid-r3bc3sjw>Work</h1><p style="text-align:center; color: var(--text-dim); max-width:560px; margin:0 auto 3rem;" data-astro-cid-r3bc3sjw>Click any piece to view it full-screen — arrow keys or swipe to move between works.</p>${artworks.length === 0 ? renderTemplate`<p style="text-align:center; color: var(--text-dim);" data-astro-cid-r3bc3sjw><em data-astro-cid-r3bc3sjw>Artwork will appear here.</em></p>` : renderTemplate`<div class="gallery-grid" id="gallery" data-astro-cid-r3bc3sjw>${artworks.map((a) => renderTemplate`<a class="art-card"${addAttribute(`${base}/work/${a.slug}/`, "href")}${addAttribute(a.data.image.src, "data-pswp-src")} data-pswp-width="1600" data-pswp-height="2000"${addAttribute(`${base}/work/${a.slug}/`, "data-details-url")}${addAttribute(`${a.data.title} (${a.data.year})`, "data-title")} data-astro-cid-r3bc3sjw><img${addAttribute(a.data.image.src, "src")}${addAttribute(a.data.alt, "alt")} loading="lazy" data-astro-cid-r3bc3sjw><div class="art-meta" data-astro-cid-r3bc3sjw><strong data-astro-cid-r3bc3sjw>${a.data.title}</strong><span data-astro-cid-r3bc3sjw>${a.data.year}${a.data.medium && ` · ${a.data.medium}`}</span></div></a>`)}</div>`}</section>${renderScript($$result, "/home/hatch/workspace/sarah-blachly-art/src/pages/work.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/work.astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/work.astro";
var $$url = "/sarah-blachly-art/work";
//#endregion
//#region \0virtual:astro:page:src/pages/work@_@astro
var page = () => work_exports;
//#endregion
export { page };
