import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('API Integration Tests', () => {
    it('should successfully hit the root health check endpoint', async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.text).toBe('API is running...');
    });

    it('should correctly reject a login attempt with an unregistered email', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'fakeuser@doesnotexist.com',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
    });
});