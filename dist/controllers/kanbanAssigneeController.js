"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAssigneeHandler = addAssigneeHandler;
exports.removeAssigneeHandler = removeAssigneeHandler;
const projectService_1 = require("../services/projectService");
const kanbanAssigneeService_1 = require("../services/kanbanAssigneeService");
async function addAssigneeHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    try {
        const isAssigneeMember = await (0, projectService_1.getMembership)(projectId, userId);
        if (!isAssigneeMember) {
            return res
                .status(403)
                .json({ message: "Assigned user is not a project member" });
        }
        await (0, kanbanAssigneeService_1.addAssigneeToCard)(cardId, userId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error adding assignee to card" });
    }
}
async function removeAssigneeHandler(req, res) {
    var _a, _b;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const userId = (_b = req.params.userId) !== null && _b !== void 0 ? _b : "";
    try {
        await (0, kanbanAssigneeService_1.removeAssigneeFromCard)(cardId, userId);
        return res.status(204).send();
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Error removing assignee from card" });
    }
}
//# sourceMappingURL=kanbanAssigneeController.js.map