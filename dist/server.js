"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const fileService_1 = require("./services/fileService");
(0, fileService_1.ensureUploadDir)().catch((error) => {
    console.error('Failed to create upload directory', error);
});
app_1.app.listen(env_1.env.port, () => {
    console.log(`Server listening on port ${env_1.env.port}`);
});
//# sourceMappingURL=server.js.map