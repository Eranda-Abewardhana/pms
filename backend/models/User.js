// ================================================================
// USER MODEL — MySQL/Sequelize
// Previously: Mongoose Schema
// ================================================================

/* ── COMMENTED OUT: Mongoose User Schema ─────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], select: false },
    role: { type: String, enum: ['admin','receptionist','doctor','nurse','cashier','labtech','patient'], required: true },
    phone: { type: String, trim: true },
    nic: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date },
    specialization: String,
    department: String,
    licenseNo: String,
    qualification: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: String,
    bloodGroup: String,
    guardian: { name: String, relationship: String, phone: String },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'receptionist', 'doctor', 'nurse', 'cashier', 'labtech', 'patient'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  nic: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  licenseNo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  qualification: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // guardian stored as JSON (replaces embedded sub-document)
  guardian: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  // ── Password reset fields ─────────────────────────────────────
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    // exclude password by default (mirrors Mongoose select: false)
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: { attributes: {} }, // include everything
  },
});

// ── Hash password before create / update ─────────────────────────
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password') && user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// ── Instance method: compare password ────────────────────────────
User.prototype.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
