import { describe, it, expect } from 'vitest';
import { validateFile, validateSlide } from './onboardingValidation';


//Unit Test for KYC Onboarding Validation

describe('KYC Onboarding Validation', () => {
    
    describe('validateFile()', () => {
        it('should allow valid PDFs and Images under 2MB', () => {
            const validFile = new File(['dummy content'], 'certificate.pdf', { type: 'application/pdf' });
            // Simulate a size under 2MB
            Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); 
            
            expect(validateFile(validFile)).toBeNull();
        });

        it('should reject invalid file types', () => {
            const invalidFile = new File(['dummy content'], 'virus.exe', { type: 'application/x-msdownload' });
            Object.defineProperty(invalidFile, 'size', { value: 1024 }); 

            expect(validateFile(invalidFile)).toBe('Only Images (JPG/PNG) or PDFs are allowed.');
        });
    });

    describe('validateSlide() - Basics', () => {
        it('should require a bio for Tutors', () => {
            const data = { bio: '   ' }; // Empty spaces
            const isTutor = true;
            const errors = validateSlide('basics', data, {}, isTutor);
            
            expect(errors.bio).toBe('Bio is required for Tutors.');
        });

        it('should NOT require a bio for Students', () => {
            const data = { bio: '' }; 
            const isTutor = false;
            const errors = validateSlide('basics', data, {}, isTutor);
            
            expect(errors.bio).toBeUndefined();
        });
    });
});