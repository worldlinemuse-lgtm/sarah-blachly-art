import { i as __exportAll, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { D as createAstro, T as unescapeHTML, _ as addAttribute, c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
import { t as getCollection } from "./_astro_content_CRZlW3N8.mjs";
//#region src/pages/work/[slug].astro
var _slug__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Slug,
	file: () => $$file,
	getStaticPaths: () => getStaticPaths,
	url: () => $$url
});
createAstro("https://worldlinemuse-lgtm.github.io");
async function getStaticPaths() {
	return (await getCollection("artworks")).map((a) => ({
		params: { slug: a.slug },
		props: { artwork: a }
	}));
}
var $$Slug = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Slug;
	const { artwork } = Astro.props;
	const { title, year, medium, dimensions, description, alt } = artwork.data;
	const img = artwork.data.image;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "VisualArtwork",
		"name": title,
		"dateCreated": String(year),
		"artMedium": medium || void 0,
		"description": description || void 0,
		"creator": {
			"@type": "Person",
			"name": "Sarah Blachly"
		}
	};
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": title,
		"description": description || `${title} (${year}) by Sarah Blachly.`
	}, { "default": ($$result) => renderTemplate`<script type="application/ld+json">${unescapeHTML(JSON.stringify(jsonLd))}<\/script>${maybeRenderHead($$result)}<article class="fade-in" style="padding: 3rem 0; max-width: 800px; margin: 0 auto;"><p><a${addAttribute(`/sarah-blachly-art/work/`, "href")}>&larr; Back to Work</a></p><h1>${title}</h1><p style="color: var(--text-dim);">${year}${medium && ` · ${medium}`}${dimensions && dimensions !== "—" && ` · ${dimensions}`}</p><img${addAttribute(img.src, "src")}${addAttribute(alt, "alt")} style="width:100%; border-radius: 12px; border: 1px solid rgba(143,184,255,0.2); box-shadow: 0 0 60px rgba(168,216,255,0.08);">${description && renderTemplate`<p style="margin-top: 1.5rem; max-width: 640px;">${description}</p>`}</article>` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/work/[slug].astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/work/[slug].astro";
var $$url = "/sarah-blachly-art/work/[slug]";
//#endregion
//#region \0virtual:astro:page:src/pages/work/[slug]@_@astro
var page = () => _slug__exports;
//#endregion
export { page };
