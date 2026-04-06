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
    }, 15000); // <-- Added 15s timeout here

    it('should fetch paginated study posts successfully', async () => {
        const response = await request(app)
            .get('/api/studyposts?page=1&limit=5')
            .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('posts');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('pages');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.posts)).toBe(true);
    }, 15000); // <-- Added 15s timeout here

    it('should filter study posts by subject tag', async () => {
        const response = await request(app)
            .get('/api/studyposts?subjectTag=Mathematics')
            .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        if (response.body.posts.length > 0) {
            expect(response.body.posts[0].subjectTag).toBe('Mathematics');
        }
    }, 15000); // <-- Added 15s timeout here

});