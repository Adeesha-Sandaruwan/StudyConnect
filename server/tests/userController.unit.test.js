import { describe, it, expect, vi } from 'vitest';
import { registerUser } from '../controllers/userController.js';
import User from '../models/User.js';

vi.mock('../models/User.js');
vi.mock('../utils/generateToken.js');

describe('User Controller - Unit Tests', () => {
    it('should return 400 if trying to register an existing user', async () => {
        const req = {
            body: { name: 'Test', email: 'test@example.com', password: 'password', role: 'student' }
        };
        
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };

        User.findOne.mockResolvedValueOnce({ email: 'test@example.com' });

        await registerUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });
});