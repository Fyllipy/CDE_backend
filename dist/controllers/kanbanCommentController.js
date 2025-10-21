"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentHandler = createCommentHandler;
exports.getCommentsHandler = getCommentsHandler;
exports.updateCommentHandler = updateCommentHandler;
exports.deleteCommentHandler = deleteCommentHandler;
const kanbanCommentService_1 = require("../services/kanbanCommentService");
const authUtils_1 = require("../middleware/authUtils");
async function createCommentHandler(req, res) {
    var _a;
    const user = (0, authUtils_1.getAuthUser)(req); // Middleware ensures user is present
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    const { body } = req.body;
    if (!body) {
        return res.status(400).json({ message: "Comment body is required" });
    }
    try {
        const comment = await (0, kanbanCommentService_1.createComment)(cardId, user.id, body);
        return res.status(201).json({ comment });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating comment" });
    }
}
async function getCommentsHandler(req, res) {
    var _a;
    const cardId = (_a = req.params.cardId) !== null && _a !== void 0 ? _a : "";
    try {
        const comments = await (0, kanbanCommentService_1.getCommentsByCardId)(cardId);
        return res.json({ comments });
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching comments" });
    }
}
async function updateCommentHandler(req, res) {
    var _a;
    const commentId = (_a = req.params.commentId) !== null && _a !== void 0 ? _a : "";
    const { body } = req.body;
    if (!body) {
        return res.status(400).json({ message: "Comment body is required" });
    }
    // TODO: Add check to ensure the user is the author of the comment
    try {
        const comment = await (0, kanbanCommentService_1.updateComment)(commentId, body);
        return res.json({ comment });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating comment" });
    }
}
async function deleteCommentHandler(req, res) {
    var _a;
    const commentId = (_a = req.params.commentId) !== null && _a !== void 0 ? _a : "";
    // TODO: Add check to ensure the user is the author of the comment or a project manager
    try {
        await (0, kanbanCommentService_1.deleteComment)(commentId);
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting comment" });
    }
}
//# sourceMappingURL=kanbanCommentController.js.map