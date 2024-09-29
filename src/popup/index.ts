const onChrome = globalThis.navigator?.userAgent.includes("Chrome");
const onFirefox = globalThis.navigator?.userAgent.includes("Firefox");

type Tab = chrome.tabs.Tab | browser.tabs.Tab;
type GetInfo = browser.windows._GetAllGetInfo & chrome.windows.QueryOptions;
type CreateProperties = browser.tabs._CreateCreateProperties &
	chrome.tabs.CreateProperties;

async function browser_windows_getAll(getInfo: GetInfo) {
	if (onChrome) return await chrome.windows.getAll(getInfo);
	if (onFirefox) return await browser.windows.getAll(getInfo);
	throw "Unsupported";
}

async function browser_windows_getCurrent(getInfo: GetInfo) {
	if (onChrome) return await chrome.windows.getCurrent(getInfo);
	if (onFirefox) return await browser.windows.getCurrent(getInfo);
	throw "Unsupported";
}

async function browser_tabs_create(createProperties: CreateProperties) {
	if (onChrome) return await chrome.tabs.create(createProperties);
	if (onFirefox) return await browser.tabs.create(createProperties);
	throw "Unsupported";
}

interface Dom {
	openInTabs: HTMLButtonElement;
	openInDiscardedTabs: HTMLButtonElement;
	filter: HTMLTextAreaElement;
	strachpad: HTMLTextAreaElement;
	includeTitle: HTMLInputElement;
	includeOtherWindows: HTMLInputElement;
}

function getDom(): Dom {
	return {
		openInTabs: document.querySelector("button[name='open-in-tabs']")!,
		openInDiscardedTabs: document.querySelector(
			"button[name='open-in-discarded-tabs']",
		)!,
		filter: document.querySelector("input[name='filter']")!,
		strachpad: document.querySelector("textarea[name='strachpad']")!,
		includeTitle: document.querySelector("input[name='include-title']")!,
		includeOtherWindows: document.querySelector(
			"input[name='include-other-windows']",
		)!,
	};
}

function getUrls(dom: Dom) {
	return dom.strachpad.value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => !line.startsWith("#"))
		.filter((line) => line.includes("://"));
}

async function updateStrachpad(dom: Dom) {
	const windows = dom.includeOtherWindows.checked
		? await browser_windows_getAll({ populate: true })
		: [await browser_windows_getCurrent({ populate: true })];

	const words = dom.filter.value
		.split(" ")
		.map((word) => word.trim())
		.filter((word) => word.length >= 1);

	const tabValidator = (tab: Tab) =>
		words.filter((word) => (tab.url ?? "").includes(word)).length ==
		words.length;
	const tabStringify = dom.includeTitle.checked
		? (tab: Tab) => `# ${tab.title}\n${tab.url}`
		: (tab: Tab) => tab.url;
	const tabSeparator = dom.includeTitle.checked ? "\n\n" : "\n";
	const winSeparator = dom.includeTitle.checked ? "\n\n---\n\n" : "\n---\n";

	dom.strachpad.value = windows
		.map((window) =>
			(window.tabs ?? [])
				.filter(tabValidator)
				.map(tabStringify)
				.join(tabSeparator),
		)
		.filter((vals) => vals.length >= 1)
		.join(winSeparator);
}

function updateButtons(dom: Dom) {
	const urls = getUrls(dom);
	dom.openInTabs.disabled = urls.length == 0;
	dom.openInDiscardedTabs.disabled = urls.length == 0;
}

async function openTab(url: string, active: boolean, discarded: boolean) {
	return discarded
		? await browser_tabs_create({ url, active, discarded })
		: await browser_tabs_create({ url, active });
}

async function openTabSafe(url: string, active: boolean, discarded: boolean) {
	try {
		await openTab(url, active, discarded);
	} catch (error) {
		console.warn(error);
	}
}

async function openTabs(dom: Dom, active: boolean, discarded: boolean) {
	const urls = getUrls(dom);
	const promises = urls.map((url) => openTabSafe(url, active, discarded));
	await Promise.all(promises);
}

async function onDomContentLoaded() {
	const dom: Dom = getDom();

	if (onChrome) {
		dom.openInDiscardedTabs.style.display = "none";
	}
	dom.includeTitle.addEventListener("change", () => updateStrachpad(dom));
	dom.includeOtherWindows.addEventListener("change", () =>
		updateStrachpad(dom),
	);
	dom.filter.addEventListener("input", () => updateStrachpad(dom));
	dom.strachpad.addEventListener("input", () => updateButtons(dom));
	dom.openInTabs.addEventListener("click", () => openTabs(dom, false, false));
	dom.openInDiscardedTabs.addEventListener("click", () =>
		openTabs(dom, false, true),
	);

	await updateStrachpad(dom);
	updateButtons(dom);
}

document.addEventListener("DOMContentLoaded", onDomContentLoaded);
