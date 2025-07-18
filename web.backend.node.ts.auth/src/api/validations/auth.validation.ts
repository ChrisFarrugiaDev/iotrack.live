const { body } = require('express-validator');

// Validation rules for login
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Enter a valid email address.'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long.')
];


