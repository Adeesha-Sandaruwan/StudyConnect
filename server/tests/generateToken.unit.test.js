import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';

vi.mock('jsonwebtoken');

describe('generateToken Utility', () => {
    it('should generate a token and set it in a secure HTTP-only cookie', () => {
        const mockResponse = {
            cookie: vi.fn()
        };
        const mockUserId = '12345abcde';
        const mockToken = 'mock.jwt.token';

        jwt.sign.mockReturnValue(mockToken);
        process.env.JWT_SECRET = 'testsecret';

        generateToken(mockResponse, mockUserId);

        expect(jwt.sign).toHaveBeenCalledWith({ userId: mockUserId }, 'testsecret', { expiresIn: '30d' });
        expect(mockResponse.cookie).toHaveBeenCalledWith('jwt', mockToken, expect.objectContaining({
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000
        }));
    });
});