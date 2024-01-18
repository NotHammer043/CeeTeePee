const child = require("child_process");
const fs = require("fs");
const package = require("./package.json");
const dependencies = Object.keys(package.dependencies);

for (let i = 0; i < dependencies.length; ++i) {
	try {
		console.log(`checking ${dependencies[i]}`);
		child.execSync(`npm ls ${dependencies[i]}`, { stdio: "ignore" });
	} catch (e) {
		i = -1;
		console.log(`installing missing modules\ndo not panic if it looks stuck\nthis can take 5+ minutes\n`);
		child.execSync(`npm i`, { stdio: "inherit" });
	}
}

console.log('done')