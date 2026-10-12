import { D as createAstro, _ as addAttribute, d as renderSlot, g as renderHead, m as renderTemplate, v as createRenderInstruction } from "./server_DcpQGrsh.mjs";
import { X as AstroError, _ as InvalidComponentArgs } from "./errors-data_gu3awsEi.mjs";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/astro/dist/runtime/server/astro-component.js
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== "object") return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
	const fn = (...args) => {
		if (!validateArgs(args)) throw new AstroError({
			...InvalidComponentArgs,
			message: InvalidComponentArgs.message(name)
		});
		return cb(...args);
	};
	Object.defineProperty(fn, "name", {
		value: name,
		writable: false
	});
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	return baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === "function") return baseCreateComponent(arg1, moduleId, propagation);
	else return createComponentWithOptions(arg1);
}
//#endregion
//#region node_modules/astro/dist/runtime/server/render/script.js
/**
* Relies on the `renderScript: true` compiler option
* @experimental
*/
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region src/layouts/Base.astro
createAstro("https://worldlinemuse-lgtm.github.io");
var $$Base = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Base;
	const { title, description = "Art portfolio of Sarah Blachly — self-taught artist." } = Astro.props;
	const base = "/sarah-blachly-art";
	return renderTemplate`<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} | Sarah Blachly Art</title><meta name="description"${addAttribute(description, "content")}><link rel="icon" type="image/svg+xml"${addAttribute(`${base}/favicon.svg`, "href")}>${renderHead($$result)}</head><body><div class="nebula" aria-hidden="true"></div><div class="milky-way" aria-hidden="true"></div><div class="stars" id="stars" aria-hidden="true"></div><div class="wrap"><nav class="site-nav" aria-label="Main navigation"><a class="brand"${addAttribute(`${base}/`, "href")}>Sarah Blachly</a><ul><li><a${addAttribute(`${base}/work/`, "href")}>Work</a></li><li><a${addAttribute(`${base}/about/`, "href")}>About</a></li><li><a${addAttribute(`${base}/process/`, "href")}>Process</a></li><li><a${addAttribute(`${base}/contact/`, "href")}>Contact</a></li></ul></nav><main>${renderSlot($$result, $$slots["default"])}</main><footer><p>&copy; <span id="year"></span> Sarah Blachly. All artwork &copy; the artist.</p></footer></div>${renderScript($$result, "/home/hatch/workspace/sarah-blachly-art/src/layouts/Base.astro?astro&type=script&index=0&lang.ts")}</body></html>`;
}, "/home/hatch/workspace/sarah-blachly-art/src/layouts/Base.astro", void 0);
//#endregion
export { __exportAll as i, renderScript as n, createComponent as r, $$Base as t };
