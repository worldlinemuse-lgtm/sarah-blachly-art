import { i as __exportAll, r as createComponent, t as $$Base } from "./Base_C_hq6Bzb.mjs";
import { c as renderComponent, h as maybeRenderHead, m as renderTemplate } from "./server_DcpQGrsh.mjs";
//#region src/pages/contact.astro
var contact_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Contact,
	file: () => $$file,
	url: () => $$url
});
var $$Contact = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "Contact",
		"description": "Contact Sarah Blachly about commissions or purchasing artwork.",
		"data-astro-cid-6bfsojfh": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<section class="fade-in" style="padding: 3rem 0; max-width: 560px; margin: 0 auto;" data-astro-cid-6bfsojfh><h1 data-astro-cid-6bfsojfh>Contact</h1><p style="color: var(--text-dim);" data-astro-cid-6bfsojfh>For commissions, purchases, or just to say hello — messages come straight to Sarah, privately.</p><form id="contact-form" action="https://api.web3forms.com/submit" method="POST" style="display:flex; flex-direction:column; gap:1rem; margin-top:2rem;" data-astro-cid-6bfsojfh><input type="hidden" name="access_key" value="YOUR-WEB3FORMS-KEY" data-astro-cid-6bfsojfh><input type="hidden" name="subject" value="New inquiry from sarah-blachly-art" data-astro-cid-6bfsojfh><input type="checkbox" name="botcheck" style="display:none;" tabindex="-1" autocomplete="off" data-astro-cid-6bfsojfh><label data-astro-cid-6bfsojfh>Name<input type="text" name="name" required placeholder="Your name" data-astro-cid-6bfsojfh></label><label data-astro-cid-6bfsojfh>Email<input type="email" name="email" required placeholder="you@example.com" data-astro-cid-6bfsojfh></label><label data-astro-cid-6bfsojfh>I'm interested in<select name="interest" data-astro-cid-6bfsojfh><option value="commission" data-astro-cid-6bfsojfh>A commission</option><option value="purchase" data-astro-cid-6bfsojfh>Purchasing an artwork</option><option value="other" data-astro-cid-6bfsojfh>Something else</option></select></label><label data-astro-cid-6bfsojfh>Message<textarea name="message" rows="5" required placeholder="Tell Sarah about your idea..." data-astro-cid-6bfsojfh></textarea></label><button class="btn" type="submit" data-astro-cid-6bfsojfh>Send Message</button></form><p style="color: var(--text-dim); font-size: 0.9rem; margin-top: 2rem;" data-astro-cid-6bfsojfh><em data-astro-cid-6bfsojfh>Social links will appear here when ready.</em></p></section>` })}`;
}, "/home/hatch/workspace/sarah-blachly-art/src/pages/contact.astro", void 0);
var $$file = "/home/hatch/workspace/sarah-blachly-art/src/pages/contact.astro";
var $$url = "/sarah-blachly-art/contact";
//#endregion
//#region \0virtual:astro:page:src/pages/contact@_@astro
var page = () => contact_exports;
//#endregion
export { page };
