import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, SECURITY } from '../config/constants.js';

const addressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['billing', 'shipping'],
        default: 'shipping'
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    street: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    postalCode: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true,
        default: 'India'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    // OAuth provider information for social logins
    oauthProviders: {
        google: {
            id: String,
            email: String
        },
        apple: {
            id: String,
            email: String
        }
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.CUSTOMER
    },
    profile: {
        firstName: {
            type: String,
            trim: true,
            maxlength: 50
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: 50
        },
        phone: {
            type: String,
            trim: true
        },
        avatar: String,
        addresses: [addressSchema]
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    status: {
        type: String,
        enum: ['active', 'blocked', 'pending'],
        default: 'pending'
    },
    // Support for multiple devices (array of refresh tokens)
    refreshTokens: [String]
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.refreshToken; // Legacy support
            delete ret.verificationToken;
            delete ret.resetPasswordToken;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
// Note: email index is automatically created by unique: true constraint
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    const firstName = this.profile?.firstName || '';
    const lastName = this.profile?.lastName || '';
    return `${firstName} ${lastName}`.trim() || this.email;
});

// Check if account is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account if max attempts reached
    if (this.failedLoginAttempts + 1 >= SECURITY.MAX_LOGIN_ATTEMPTS) {
        updates.$set = {
            lockUntil: Date.now() + SECURITY.LOCK_DURATION_MINUTES * 60 * 1000
        };
    }

    return this.updateOne(updates);
};

// Method to reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: {
            failedLoginAttempts: 0,
            lastLogin: new Date()
        },
        $unset: { lockUntil: 1 }
    });
};

// Method to get default shipping address
userSchema.methods.getDefaultAddress = function (type = 'shipping') {
    if (!this.profile?.addresses?.length) return null;

    const defaultAddr = this.profile.addresses.find(
        addr => addr.type === type && addr.isDefault
    );

    return defaultAddr || this.profile.addresses[0];
};

// Static method to check if email exists
userSchema.statics.emailExists = async function (email) {
    const user = await this.findOne({ email: email.toLowerCase() });
    return !!user;
};

const User = mongoose.model('User', userSchema);

export default User;
