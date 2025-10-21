"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabelHandler = createLabelHandler;
exports.getLabelsHandler = getLabelsHandler;
exports.updateLabelHandler = updateLabelHandler;
exports.deleteLabelHandler = deleteLabelHandler;
exports.addLabelToCardHandler = addLabelToCardHandler;
exports.removeLabelFromCardHandler = removeLabelFromCardHandler;
const kanbanLabelService_1 = require("../services/kanbanLabelService");
const projectService_1 = require("../services/projectService");
async function createLabelHandler(req, res) {
    var _a, _b, _c;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { name, color } = req.body;
    let membership = req.projectMembership;
    if (!membership) {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    const role = ((_c = membership === null || membership === void 0 ? void 0 : membership.role) !== null && _c !== void 0 ? _c : "").trim().toUpperCase();
    console.log('createLabelHandler role:', membership === null || membership === void 0 ? void 0 : membership.role, 'normalized:', role, 'projectId:', projectId);
    if (!membership || role !== "MANAGER") {
        return res.status(403).json({ message: "Only project managers can create labels" });
    }
    if (!name || !color) {
        return res.status(400).json({ message: "Label name and color are required" });
    }
    try {
        const label = await (0, kanbanLabelService_1.createLabel)(projectId, name, color);
        return res.status(201).json({ label });
    }
    catch (error) {
        // @ts-ignore
        if (error.constraint === "unique_project_label_name") {
            return res.status(409).json({ message: "Label name already exists" });
        }
        return res.status(500).json({ message: "Error creating label" });
    }
}
async function getLabelsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    try {
        const labels = await (0, kanbanLabelService_1.getLabelsByProjectId)(projectId);
        return res.json({ labels });
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching labels" });
    }
}
async function updateLabelHandler(req, res) {
    var _a, _b, _c, _d;
    const labelId = (_a = req.params.labelId) !== null && _a !== void 0 ? _a : "";
    const { name, color } = req.body;
    let membership = req.projectMembership;
    if (!membership) {
        const projectId = (_b = req.params.projectId) !== null && _b !== void 0 ? _b : "";
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    const role = ((_d = membership === null || membership === void 0 ? void 0 : membership.role) !== null && _d !== void 0 ? _d : "").trim().toUpperCase();
    if (!membership || role !== "MANAGER") {
        return res.status(403).json({ message: "Only project managers can update labels" });
    }
    if (!name && !color) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    try {
        const label = await (0, kanbanLabelService_1.updateLabel)(labelId, { name, color });
        return res.json({ label });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating label" });
    }
}
async function deleteLabelHandler(req, res) {
    var _a, _b, _c, _d;
    const labelId = (_a = req.params.labelId) !== null && _a !== void 0 ? _a : "";
    let membership = req.projectMembership;
    if (!membership) {
        const projectId = (_b = req.params.projectId) !== null && _b !== void 0 ? _b : "";
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    const role = ((_d = membership === null || membership === void 0 ? void 0 : membership.role) !== null && _d !== void 0 ? _d : "").trim().toUpperCase();
    if (!membership || role !== "MANAGER") {
        return res.status(403).json({ message: "Only project managers can delete labels" });
    }
    try {
        await (0, kanbanLabelService_1.deleteLabel)(labelId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting label" });
    }
}
async function addLabelToCardHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const { labelId } = req.body;
    if (!labelId) {
        return res.status(400).json({ message: "Label ID is required" });
    }
    try {
        await (0, kanbanLabelService_1.addLabelToCard)(cardId, labelId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error adding label to card" });
    }
}
async function removeLabelFromCardHandler(req, res) {
    var _a, _b;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const labelId = (_b = req.params.labelId) !== null && _b !== void 0 ? _b : "";
    try {
        await (0, kanbanLabelService_1.removeLabelFromCard)(cardId, labelId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error removing label from card" });
    }
}
//# sourceMappingURL=kanbanLabelController.js.map