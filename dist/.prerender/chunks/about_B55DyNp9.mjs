import { i as __exportAll, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
//#region src/pages/about.astro
var about_exports = /* @__PURE__ */ __exportAll({
	default: () => $$About,
	file: () => $$file,
	url: () => $$url
});
var $$About = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "About",
		"description": "About Sarah Blachly — self-taught artist."
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="fade-in" style="padding: 3rem 0; max-width: 680px; margin: 0 auto;"><h1>About</h1><h2>Bio</h2><p style="color: var(--text-dim);"><em>Your bio goes here.</em></p><h2>Artist Statement</h2><p style="color: var(--text-dim);"><em>Your artist statement goes here.</em></p><h2>The Self-Taught Path</h2><p>No official schooling — just a life full of practice. That should be part of the story, and it is: every piece here was learned the long way, by doing.</p><p style="color: var(--text-dim);"><em>Expand on your journey here.</em></p><h2>CV / Exhibition History</h2><p style="color: var(--text-dim);"><em>Exhibitions, shows, and press will be listed here as they come.</em></p></section>` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/about.astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/about.astro";
var $$url = "/sarah-blachly-art/about";
//#endregion
//#region \0virtual:astro:page:src/pages/about@_@astro
var page = () => about_exports;
//#endregion
export { page };
