'use strict';

var GulpConfig = (function () {
    function GulpConfig() {

        this.typeScriptFiles = [
            "src/**/*.ts",
            "!src/tests/**"
        ];
        this.typeScriptLintFiles = [
            "src/**/*.ts"
        ];

        this.target = "dist";

        // this.browserSyncOptions = {
        //     injectChanges: true,
        //     reloadDelay: 500,
        //     open: false,
        //     online: true,
        //     reloadOnRestart: true,
        //     port: 9999,
        //     server: {
        //         baseDir: ".",
        //         directory: true
        //     },
        //     files: "tests/**/*"
        // };

    }

    return GulpConfig;
})();
module.exports = GulpConfig;
