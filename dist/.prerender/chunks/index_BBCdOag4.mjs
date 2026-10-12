import { i as __exportAll, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { _ as addAttribute, c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const base = "/sarah-blachly-art";
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "Home",
		"description": "Sarah Blachly — self-taught artist. A dark forest gallery under the Milky Way."
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="hero fade-in"><h1>Sarah Blachly</h1><p>Self-taught artist. No official schooling — just a life full of practice. Step into the dark forest, look up, and stay a while.</p><a class="btn"${addAttribute(`${base}/work/`, "href")}>Enter the Gallery</a></section><hr class="divider"><section class="fade-in" style="text-align:center; max-width:640px; margin:0 auto;"><h2>Artist Statement</h2><p style="color: var(--text-dim);"><em>Your artist statement will live here — a few lines about what you make and why.</em></p></section><hr class="divider"><section class="fade-in" style="text-align:center;"><h2>Featured Work</h2><p style="color: var(--text-dim);"><em>Flagship pieces will appear here once artwork is added.</em></p><a class="btn"${addAttribute(`${base}/work/`, "href")}>Browse All Work</a></section>` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/index.astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/index.astro";
var $$url = "/sarah-blachly-art";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
