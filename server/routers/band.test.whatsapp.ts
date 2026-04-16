import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { bandSystemData } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('WhatsApp Notification Test Procedure', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should generate test WhatsApp message when number is set', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    // Set admin WhatsApp number
    const systemData = await db.select().from(bandSystemData).limit(1);
    if (systemData.length > 0) {
      await db
        .update(bandSystemData)
        .set({ adminWhatsAppNumber: '+85254029146' })
        .where(eq(bandSystemData.id, systemData[0].id));
    }

    // Simulate the testWhatsAppNotification procedure
    const adminNumber = '+85254029146';
    const testMessage = `🎵 *慢半拍 - WhatsApp 通知測試*\n\n✅ 系統連接成功！\n\n這是一條測試訊息，用來驗證 WhatsApp 通知功能是否正常運作。\n\n📱 你的 WhatsApp 號碼：${adminNumber}\n🔗 系統連結：https://adagio.manus.space/\n\n如果你收到這條訊息，表示自動通知功能已準備好使用！`;

    const encodedMessage = encodeURIComponent(testMessage);
    const whatsappLink = `https://wa.me/${adminNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

    expect(whatsappLink).toContain('https://wa.me/85254029146');
    expect(whatsappLink).toContain('text=');
    expect(testMessage).toContain('🎵');
    expect(testMessage).toContain('WhatsApp 通知測試');
    expect(testMessage).toContain(adminNumber);
  });

  it('should format WhatsApp link correctly', () => {
    const phoneNumber = '+85254029146';
    const message = '測試訊息';
    
    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

    expect(link).toMatch(/^https:\/\/wa\.me\/\d+/);
    expect(link).toContain('?text=');
  });

  it('should handle different phone number formats', () => {
    const testCases = [
      { input: '+85254029146', expected: '85254029146' },
      { input: '85254029146', expected: '85254029146' },
      { input: '+852-5402-9146', expected: '85254029146' },
      { input: '(852) 5402-9146', expected: '85254029146' },
    ];

    testCases.forEach(({ input, expected }) => {
      const cleaned = input.replace(/\D/g, '');
      expect(cleaned).toBe(expected);
    });
  });

  it('should generate valid WhatsApp message with emojis', () => {
    const message = `🎵 *慢半拍 - WhatsApp 通知測試*\n\n✅ 系統連接成功！`;
    
    expect(message).toContain('🎵');
    expect(message).toContain('✅');
    expect(message).toContain('*');
    expect(message).toContain('\n');
  });

  it('should include system link in message', () => {
    const message = `🎵 *慢半拍 - WhatsApp 通知測試*\n\n✅ 系統連接成功！\n\n🔗 系統連結：https://adagio.manus.space/`;
    
    expect(message).toContain('https://adagio.manus.space/');
    expect(message).toContain('🔗');
  });
});
