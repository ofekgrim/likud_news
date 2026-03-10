import { describe, it, expect } from 'vitest';
import {
  memberSchema,
  userSchema,
  userUpdateSchema,
  pushNotificationSchema,
  tickerSchema,
} from '../schemas';

describe('memberSchema', () => {
  it('validates a valid member', () => {
    const result = memberSchema.safeParse({
      name: 'Test Member',
      nameEn: 'Test Member EN',
      isActive: true,
      sortOrder: 0,
    });
    expect(result.success).toBe(true);
  });

  it('requires name field', () => {
    const result = memberSchema.safeParse({
      nameEn: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('shows Hebrew error for missing name', () => {
    const result = memberSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'));
      expect(nameError?.message).toBe('שם נדרש');
    }
  });

  it('allows empty optional fields', () => {
    const result = memberSchema.safeParse({
      name: 'Test',
      nameEn: '',
      title: '',
      bio: '',
      photoUrl: '',
      socialTwitter: '',
      socialFacebook: '',
      socialInstagram: '',
    });
    expect(result.success).toBe(true);
  });

  it('defaults isActive to true', () => {
    const result = memberSchema.parse({ name: 'Test' });
    expect(result.isActive).toBe(true);
  });

  it('defaults sortOrder to 0', () => {
    const result = memberSchema.parse({ name: 'Test' });
    expect(result.sortOrder).toBe(0);
  });
});

describe('userSchema', () => {
  it('validates a valid user', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = userSchema.safeParse({
      email: 'not-an-email',
      name: 'Test',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailError?.message).toBe('כתובת דוא"ל לא תקינה');
    }
  });

  it('rejects password shorter than 6 chars', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test',
      password: '12345',
      role: 'admin',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passError = result.error.issues.find((i) => i.path.includes('password'));
      expect(passError?.message).toBe('סיסמה חייבת להכיל לפחות 6 תווים');
    }
  });

  it('only allows valid roles', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test',
      password: 'password123',
      role: 'invalid_role',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid role values', () => {
    for (const role of ['super_admin', 'admin', 'editor']) {
      const result = userSchema.safeParse({
        email: 'test@example.com',
        name: 'Test',
        password: 'password123',
        role,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('userUpdateSchema', () => {
  it('allows password to be optional', () => {
    const result = userUpdateSchema.safeParse({
      email: 'test@example.com',
      name: 'Test',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty password', () => {
    const result = userUpdateSchema.safeParse({
      email: 'test@example.com',
      name: 'Test',
      password: '',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });
});

describe('pushNotificationSchema', () => {
  it('validates a valid notification', () => {
    const result = pushNotificationSchema.safeParse({
      title: 'Breaking News',
      body: 'Important update',
    });
    expect(result.success).toBe(true);
  });

  it('requires title', () => {
    const result = pushNotificationSchema.safeParse({
      title: '',
      body: 'Content',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'));
      expect(titleError?.message).toBe('כותרת נדרשת');
    }
  });

  it('requires body', () => {
    const result = pushNotificationSchema.safeParse({
      title: 'Title',
      body: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const bodyError = result.error.issues.find((i) => i.path.includes('body'));
      expect(bodyError?.message).toBe('תוכן נדרש');
    }
  });
});

describe('tickerSchema', () => {
  it('validates a valid ticker item', () => {
    const result = tickerSchema.safeParse({
      text: 'Breaking headline',
      isActive: true,
      position: 0,
    });
    expect(result.success).toBe(true);
  });

  it('requires text', () => {
    const result = tickerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('shows Hebrew error for missing text', () => {
    const result = tickerSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const textError = result.error.issues.find((i) => i.path.includes('text'));
      expect(textError?.message).toBe('טקסט נדרש');
    }
  });

  it('rejects text longer than 500 chars', () => {
    const result = tickerSchema.safeParse({
      text: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('defaults isActive to true', () => {
    const result = tickerSchema.parse({ text: 'Test' });
    expect(result.isActive).toBe(true);
  });

  it('defaults position to 0', () => {
    const result = tickerSchema.parse({ text: 'Test' });
    expect(result.position).toBe(0);
  });
});
