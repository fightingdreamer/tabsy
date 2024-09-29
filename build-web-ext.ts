import { $ } from "bun";

{
	const target = "firefox";

	// lint
	await $`web-ext lint --source-dir ./out/${target}`;

	// build
	await $`web-ext build --source-dir ./out/${target} --artifacts-dir ./dist/${target} --overwrite-dest`;
}
