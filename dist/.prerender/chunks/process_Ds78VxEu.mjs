import { i as __exportAll, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
//#region src/pages/process.astro
var process_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Process,
	file: () => $$file,
	url: () => $$url
});
var $$Process = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "Process",
		"description": "Sketches, timelapses, and studio documentation from Sarah Blachly."
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="fade-in" style="padding: 3rem 0; max-width: 680px; margin: 0 auto;"><h1>Process</h1><p>Sketches, timelapses, and notes from the studio — how the work comes to be.</p><p style="color: var(--text-dim);"><em>Studio documentation will appear here.</em></p></section>` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/process.astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/process.astro";
var $$url = "/sarah-blachly-art/process";
//#endregion
//#region \0virtual:astro:page:src/pages/process@_@astro
var page = () => process_exports;
//#endregion
export { page };
