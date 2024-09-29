import { $ } from "bun";

// init
await $`rm -rf ./out`;

const targets = ["firefox", "chrome"];

for (const target of targets) {
	// build js
	await $`bun build ./src/popup/index.ts --target browser --outfile ./out/${target}/popup/index.js`;

	// build css
	await $`tailwindcss --input ./src/popup/style.css --output ./out/${target}/popup/style.css`;

	// build html
	await $`cp ./src/popup/index.html ./out/${target}/popup/index.html`;
	await $`cp ./src/asset/manifest-${target}.json ./out/${target}/manifest.json`;

	// copy icons
	await $`mkdir ./out/${target}/icon`;
	for (const size of [16, 48, 128]) {
		await $`cp -r ./src/asset/icon/${size}x${size}.png ./out/${target}/icon`;
	}
}
