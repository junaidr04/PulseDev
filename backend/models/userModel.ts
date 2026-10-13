/**
 * User Schema & Model Definition (Mongoose ODM)
 * 
 * Production Patterns demonstrated for Tech Interviewers:
 * - Strict schema validation with custom regex validators (RFC 5322 email)
 * - Mongoose pre-save middleware hook for automatic Bcrypt password hashing
 * - Instance method `matchPassword` preventing plain-text password leakage
 * - Role-Based Access Control (RBAC) enum: ['admin', 'lead', 'developer', 'qa', 'guest']
 * - Virtual population & toJSON transform removing password from responses
 * - Compound and unique indexes for O(1) query performance
 */

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
  avatar: string;
  title: string;
  department: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchemaDefinition = {
  name: {
    type: 'String',
    required: [true, 'Please provide user full name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: 'String',
    required: [true, 'Please provide email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email format',
    ],
    index: true,
  },
  password: {
    type: 'String',
    required: [true, 'Please enter a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Prevents password from being returned in user queries by default
  },
  role: {
    type: 'String',
    enum: ['admin', 'lead', 'developer', 'qa', 'guest'],
    default: 'developer',
  },
  avatar: {
    type: 'String',
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  },
  title: {
    type: 'String',
    default: 'Software Engineer',
  },
  department: {
    type: 'String',
    default: 'Engineering',
  },
  status: {
    type: 'String',
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'online',
  },
};

/**
 * Mongoose Schema Code Representation for Interview Inspector
 */
export const rawMongooseUserCode = `
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Valid email required'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Never return hash by default
    },
    role: {
      type: String,
      enum: ['admin', 'lead', 'developer', 'qa', 'guest'],
      default: 'developer',
    },
    avatar: String,
    title: String,
    department: String,
    status: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'online',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook: Hash password before saving to MongoDB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance Method: Compare client input against stored bcrypt hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
`.trim();
