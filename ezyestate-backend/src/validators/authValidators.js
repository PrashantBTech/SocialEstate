const Joi = require('joi');

const registerSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).required(),
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('owner', 'builder', 'buyer').default('buyer'),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  pincode: Joi.string().length(6).optional(),
});

const loginSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6),
  password: Joi.string(),
}).xor('otp', 'password');

module.exports = { registerSchema, loginSchema };
