const express = require('express');
const router = express.Router();
const { Document, Draft, User, DocumentShare } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const googleDriveService = require('../services/googleDrive');

// Get all documents (including shared ones)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const documents = await Document.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.uid },
                    { '$sharedWith.uid$': req.user.uid }
                ],
                isArchived: false
            },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['uid', 'name', 'email', 'picture']
            }, {
                model: User,
                as: 'sharedWith',
                attributes: ['uid', 'name', 'email', 'picture'],
                through: { attributes: ['role'] }
            }],
            order: [['updatedAt', 'DESC']]
        });

        res.json({ success: true, documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Get single document
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const document = await Document.findOne({
            where: {
                id: req.params.id,
                [Op.or]: [
                    { userId: req.user.uid },
                    { '$sharedWith.uid$': req.user.uid }
                ]
            },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['uid', 'name', 'email', 'picture']
            }, {
                model: User,
                as: 'sharedWith',
                attributes: ['uid', 'name', 'email', 'picture'],
                through: { attributes: ['role'] }
            }]
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ success: true, document });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// Create new document
router.post('/', authenticateToken, async (req, res) => {
    try {
        const document = await Document.create({
            userId: req.user.uid,
            title: req.body.title || 'Untitled',
            content: req.body.content || '',
            lastModified: new Date()
        });

        const documentWithOwner = await Document.findOne({
            where: { id: document.id },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['uid', 'name', 'email', 'picture']
            }]
        });

        res.json({ success: true, document: documentWithOwner });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

// Update document
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, title } = req.body;

        // Find document with permissions check
        const document = await Document.findOne({
            where: {
                id,
                [Op.or]: [
                    { userId: req.user.uid },
                    {
                        '$sharedWith.uid$': req.user.uid,
                        '$sharedWith.DocumentShare.role$': 'editor'
                    }
                ]
            },
            include: [{
                model: User,
                as: 'sharedWith',
                through: { attributes: ['role'] }
            }]
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or unauthorized'
            });
        }

        // Create a draft before updating (optional)
        if (content && document.content !== content) {
            await Draft.create({
                documentId: id,
                userId: req.user.uid,
                content: document.content || '',
                savedAt: new Date()
            });
        }

        // Update the document
        const updateData = {};
        if (content !== undefined) updateData.content = content;
        if (title !== undefined) updateData.title = title;
        updateData.lastModified = new Date();

        await document.update(updateData);

        // Get updated document with all associations
        const updatedDocument = await Document.findOne({
            where: { id },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['uid', 'name', 'email', 'picture']
            }, {
                model: User,
                as: 'sharedWith',
                attributes: ['uid', 'name', 'email', 'picture'],
                through: { attributes: ['role'] }
            }]
        });

        res.json({
            success: true,
            document: updatedDocument
        });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, error: 'Failed to update document' });
    }
});

// Archive document
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const document = await Document.findOne({
            where: {
                id: req.params.id,
                userId: req.user.uid
            }
        });

        if (!document) {
            return res.status(404).json({ success: false, error: "Document not found" });
        }

        await document.update({ isArchived: true });
        res.json({ success: true, message: "Document archived" });
    } catch (error) {
        console.error('Error archiving document:', error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Share document with another user
router.post('/:id/share', authenticateToken, async (req, res) => {
    try {
        const { email, role } = req.body;
        const documentId = req.params.id;

        // Check if user has permission to share
        const document = await Document.findOne({
            where: { id: documentId },
            include: [{
                model: User,
                as: 'sharedWith',
                through: { attributes: ['role'] }
            }]
        });

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Only owner can share
        if (document.userId !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'Not authorized to share this document' });
        }

        // Find user by email
        const userToShare = await User.findOne({ where: { email } });
        if (!userToShare) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Don't share with owner
        if (userToShare.uid === req.user.uid) {
            return res.status(400).json({ success: false, error: 'Cannot share with yourself' });
        }

        // Check if already shared
        const existingShare = await DocumentShare.findOne({
            where: {
                documentId,
                userId: userToShare.uid
            }
        });

        if (existingShare) {
            // Update role if already shared
            await existingShare.update({ role });
        } else {
            // Create new share
            await DocumentShare.create({
                documentId,
                userId: userToShare.uid,
                role
            });
        }

        // Get updated document with shares
        const updatedDocument = await Document.findOne({
            where: { id: documentId },
            include: [{
                model: User,
                as: 'sharedWith',
                through: { attributes: ['role'] },
                attributes: ['uid', 'name', 'email', 'picture']
            }]
        });

        res.json({
            success: true,
            document: updatedDocument
        });

    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ success: false, error: 'Failed to share document' });
    }
});

// Remove share from document
router.delete('/:id/share/:userId', authenticateToken, async (req, res) => {
    try {
        const { id: documentId, userId } = req.params;

        // Check if user has permission to remove share
        const document = await Document.findOne({
            where: { id: documentId }
        });

        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Only owner can remove shares
        if (document.userId !== req.user.uid) {
            return res.status(403).json({ success: false, error: 'Not authorized to modify shares' });
        }

        // Remove share
        await DocumentShare.destroy({
            where: {
                documentId,
                userId
            }
        });

        res.json({
            success: true,
            documentId,
            userId
        });

    } catch (error) {
        console.error('Error removing share:', error);
        res.status(500).json({ success: false, error: 'Failed to remove share' });
    }
});

// Save document to Google Drive
router.post('/:id/save-to-drive', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { accessToken } = req.body;

        const document = await Document.findOne({
            where: {
                id,
                userId: req.user.uid
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Save to Google Drive with raw content
        const result = document.driveFileId
            ? await googleDriveService.updateDocument(
                document.driveFileId,
                document.content,
                document.title,
                accessToken
            )
            : await googleDriveService.saveDocument(
                document.content,
                document.title,
                accessToken
            );

        // Update document with Drive info
        await document.update({
            driveFileId: result.fileId,
            driveLink: result.webViewLink
        });

        res.json(result);
    } catch (error) {
        console.error('Error saving to Google Drive:', error);
        res.status(500).json({ error: 'Failed to save to Google Drive' });
    }
});

module.exports = router; 