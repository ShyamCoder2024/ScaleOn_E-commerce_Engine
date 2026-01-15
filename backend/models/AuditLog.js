import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../config/constants.js';

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: Object.values(AUDIT_ACTIONS)
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resource: {
        type: {
            type: String,
            required: true
        },
        id: mongoose.Schema.Types.ObjectId,
        name: String // Human-readable name for quick reference
    },
    details: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    // Request metadata
    ipAddress: String,
    userAgent: String,
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // Using custom timestamp field
});

// Indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ 'resource.type': 1 });
auditLogSchema.index({ 'resource.id': 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year TTL

// Static method to log action
auditLogSchema.statics.log = async function ({
    action,
    actor,
    resourceType,
    resourceId = null,
    resourceName = null,
    details = {},
    ipAddress = null,
    userAgent = null
}) {
    const log = new this({
        action,
        actor,
        resource: {
            type: resourceType,
            id: resourceId,
            name: resourceName
        },
        details: new Map(Object.entries(details)),
        ipAddress,
        userAgent
    });

    return log.save();
};

// Static method to get logs for a specific resource
auditLogSchema.statics.getResourceHistory = async function (resourceType, resourceId, limit = 50) {
    return this.find({
        'resource.type': resourceType,
        'resource.id': resourceId
    })
        .populate('actor', 'email profile.firstName profile.lastName')
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method to get logs by actor
auditLogSchema.statics.getActorHistory = async function (actorId, options = {}) {
    const { page = 1, limit = 50, action = null } = options;

    const filter = { actor: actorId };
    if (action) {
        filter.action = action;
    }

    const [logs, total] = await Promise.all([
        this.find(filter)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        this.countDocuments(filter)
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Static method to get recent activity
auditLogSchema.statics.getRecentActivity = async function (options = {}) {
    const { limit = 20, actions = null, resourceType = null } = options;

    const filter = {};
    if (actions && actions.length) {
        filter.action = { $in: actions };
    }
    if (resourceType) {
        filter['resource.type'] = resourceType;
    }

    return this.find(filter)
        .populate('actor', 'email profile.firstName profile.lastName role')
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method to get activity summary
auditLogSchema.statics.getActivitySummary = async function (startDate, endDate) {
    const match = {
        timestamp: { $gte: startDate, $lte: endDate }
    };

    const summary = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return summary;
};

// Static method to search logs
auditLogSchema.statics.search = async function (query, options = {}) {
    const {
        page = 1,
        limit = 50,
        startDate = null,
        endDate = null,
        actions = null,
        actors = null,
        resourceTypes = null
    } = options;

    const filter = {};

    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (actions && actions.length) {
        filter.action = { $in: actions };
    }

    if (actors && actors.length) {
        filter.actor = { $in: actors };
    }

    if (resourceTypes && resourceTypes.length) {
        filter['resource.type'] = { $in: resourceTypes };
    }

    if (query) {
        filter.$or = [
            { 'resource.name': { $regex: query, $options: 'i' } },
            { action: { $regex: query, $options: 'i' } }
        ];
    }

    const [logs, total] = await Promise.all([
        this.find(filter)
            .populate('actor', 'email profile.firstName profile.lastName role')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        this.countDocuments(filter)
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
