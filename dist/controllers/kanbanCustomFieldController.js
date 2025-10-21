"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomFieldsHandler = listCustomFieldsHandler;
exports.createCustomFieldHandler = createCustomFieldHandler;
exports.updateCustomFieldHandler = updateCustomFieldHandler;
exports.deleteCustomFieldHandler = deleteCustomFieldHandler;
exports.setCardCustomFieldHandler = setCardCustomFieldHandler;
const pool_1 = require("../db/pool");
const kanbanCustomFieldService_1 = require("../services/kanbanCustomFieldService");
const projectService_1 = require("../services/projectService");
const ALLOWED_TYPES = ["TEXT", "NUMBER", "DATE", "LIST", "BOOLEAN"];
function isManager(membership) {
    var _a;
    const role = (_a = membership === null || membership === void 0 ? void 0 : membership.role) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
    return role === "MANAGER";
}
async function ensureFieldBelongsToProject(fieldId, projectId) {
    var _a, _b;
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanCustomFieldDef" WHERE id = $1', [fieldId]);
    return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null) === projectId;
}
async function ensureCardBelongsToProject(cardId, projectId) {
    var _a, _b;
    const result = await pool_1.pool.query('SELECT "projectId" FROM "KanbanCard" WHERE id = $1', [cardId]);
    return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.projectId) !== null && _b !== void 0 ? _b : null) === projectId;
}
async function listCustomFieldsHandler(req, res) {
    var _a;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    try {
        const fields = await (0, kanbanCustomFieldService_1.getCustomFieldDefsByProject)(projectId);
        return res.json({ fields });
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching custom fields" });
    }
}
async function createCustomFieldHandler(req, res) {
    var _a, _b;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const { name, type, options, required } = req.body;
    let membership = req.projectMembership;
    if (!membership) {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    if (!isManager(membership)) {
        return res.status(403).json({ message: "Only project managers can manage custom fields" });
    }
    if (!(name === null || name === void 0 ? void 0 : name.trim()) || !type) {
        return res.status(400).json({ message: "Name and type are required" });
    }
    if (!ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid custom field type" });
    }
    try {
        const field = await (0, kanbanCustomFieldService_1.createCustomFieldDef)(projectId, name.trim(), type, options !== null && options !== void 0 ? options : null, Boolean(required));
        return res.status(201).json({ field });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating custom field" });
    }
}
async function updateCustomFieldHandler(req, res) {
    var _a, _b, _c;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const fieldId = (_b = req.params.fieldId) !== null && _b !== void 0 ? _b : "";
    const { name, type, options, required } = req.body;
    let membership = req.projectMembership;
    if (!membership) {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    if (!isManager(membership)) {
        return res.status(403).json({ message: "Only project managers can manage custom fields" });
    }
    const belongs = await ensureFieldBelongsToProject(fieldId, projectId);
    if (!belongs) {
        return res.status(404).json({ message: "Custom field not found" });
    }
    if (!name && !type && options === undefined && required === undefined) {
        return res.status(400).json({ message: "Nothing to update" });
    }
    if (type && !ALLOWED_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid custom field type" });
    }
    try {
        const field = await (0, kanbanCustomFieldService_1.updateCustomFieldDef)(fieldId, {
            name: name === null || name === void 0 ? void 0 : name.trim(),
            type,
            options: options !== null && options !== void 0 ? options : null,
            required,
        });
        return res.json({ field });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating custom field" });
    }
}
async function deleteCustomFieldHandler(req, res) {
    var _a, _b, _c;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const fieldId = (_b = req.params.fieldId) !== null && _b !== void 0 ? _b : "";
    let membership = req.projectMembership;
    if (!membership) {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (userId) {
            membership = await (0, projectService_1.getMembership)(projectId, userId);
        }
    }
    if (!isManager(membership)) {
        return res.status(403).json({ message: "Only project managers can manage custom fields" });
    }
    const belongs = await ensureFieldBelongsToProject(fieldId, projectId);
    if (!belongs) {
        return res.status(404).json({ message: "Custom field not found" });
    }
    try {
        await (0, kanbanCustomFieldService_1.deleteCustomFieldDef)(fieldId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting custom field" });
    }
}
function normalizeValue(type, value) {
    if (value === null || value === undefined) {
        return null;
    }
    switch (type) {
        case "TEXT":
            return String(value);
        case "NUMBER":
            if (Number.isNaN(Number(value))) {
                throw new Error("INVALID_NUMBER");
            }
            return Number(value);
        case "DATE":
            if (!value) {
                return null;
            }
            const asDate = new Date(value);
            if (Number.isNaN(asDate.getTime())) {
                throw new Error("INVALID_DATE");
            }
            return asDate.toISOString();
        case "BOOLEAN":
            if (typeof value === "boolean") {
                return value;
            }
            if (value === "true" || value === 1) {
                return true;
            }
            if (value === "false" || value === 0) {
                return false;
            }
            throw new Error("INVALID_BOOLEAN");
        case "LIST":
            if (Array.isArray(value)) {
                return value;
            }
            return [value];
        default:
            return value;
    }
}
async function setCardCustomFieldHandler(req, res) {
    var _a, _b, _c;
    const projectId = (_a = req.params.projectId) !== null && _a !== void 0 ? _a : "";
    const cardId = (_b = req.params.cardId) !== null && _b !== void 0 ? _b : "";
    const fieldId = (_c = req.params.fieldId) !== null && _c !== void 0 ? _c : "";
    const { value } = req.body;
    const [cardBelongs, fieldRow] = await Promise.all([
        ensureCardBelongsToProject(cardId, projectId),
        pool_1.pool.query('SELECT "projectId", type FROM "KanbanCustomFieldDef" WHERE id = $1', [fieldId]),
    ]);
    if (!cardBelongs) {
        return res.status(404).json({ message: "Card not found" });
    }
    const fieldInfo = fieldRow.rows[0];
    if (!fieldInfo || fieldInfo.projectId !== projectId) {
        return res.status(404).json({ message: "Custom field not found" });
    }
    try {
        const parsedValue = normalizeValue(fieldInfo.type, value);
        const persisted = await (0, kanbanCustomFieldService_1.upsertCardCustomFieldValue)(cardId, fieldId, parsedValue);
        return res.json({ value: persisted });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "INVALID_NUMBER") {
                return res.status(400).json({ message: "Invalid number value" });
            }
            if (error.message === "INVALID_DATE") {
                return res.status(400).json({ message: "Invalid date value" });
            }
            if (error.message === "INVALID_BOOLEAN") {
                return res.status(400).json({ message: "Invalid boolean value" });
            }
        }
        return res.status(500).json({ message: "Error setting custom field value" });
    }
}
//# sourceMappingURL=kanbanCustomFieldController.js.map