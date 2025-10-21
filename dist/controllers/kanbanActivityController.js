"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityHandler = getActivityHandler;
const kanbanActivityService_1 = require("../services/kanbanActivityService");
async function getActivityHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    try {
        const activities = await (0, kanbanActivityService_1.getActivityByCardId)(cardId);
        return res.json({ activities });
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching activities" });
    }
}
//# sourceMappingURL=kanbanActivityController.js.map