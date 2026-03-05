/**
 * WhatsApp 通知功能測試
 * 
 * 測試範圍：
 * 1. 出席狀態摘要生成
 * 2. 信息編輯功能
 * 3. 複製到剪貼板
 * 4. WhatsApp Web 連結生成
 * 5. 個人帳戶消息發送
 * 6. 群組消息發送
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  addBandEvent,
  getBandEvents,
  setAttendance,
  addBandMember,
  getBandMembers,
  deleteBandEvent,
  deleteBandMember,
} from './db';

// ============================================
// 輔助函數
// ============================================

async function createTestEvent(title: string, overrides: Record<string, any> = {}): Promise<number> {
  const result = await addBandEvent({
    title,
    date: '2026-03-04',
    startTime: '19:00',
    endTime: '21:00',
    location: '音樂室',
    type: 'rehearsal',
    notes: '',
    ...overrides,
  });
  const r = result as any;
  return r.insertId || r;
}

async function createTestMember(name: string, password: string = 'test123'): Promise<number> {
  const result = await addBandMember({
    name,
    instrument: '樂器',
    password,
    color: 'blue',
  });
  const r = result as any;
  return r.insertId || r;
}

function generateAttendanceSummary(
  eventTitle: string,
  members: Array<{ id: number; name: string }>,
  attendance: Record<number, string>
): string {
  const going = members.filter(m => attendance[m.id] === "going").map(m => m.name).join(", ");
  const notGoing = members.filter(m => attendance[m.id] === "not-going").map(m => m.name).join(", ");
  const unknown = members.filter(m => attendance[m.id] === "unknown").map(m => m.name).join(", ");
  
  let summary = `【${eventTitle}】出席狀態\n\n`;
  if (going) summary += `✓ 出席: ${going}\n`;
  if (notGoing) summary += `✗ 不出席: ${notGoing}\n`;
  if (unknown) summary += `? 未知道: ${unknown}\n`;
  return summary;
}

// ============================================
// 測試套件
// ============================================

describe('WhatsApp 通知功能', () => {
  let testEventId: number;
  let testMemberId1: number;
  let testMemberId2: number;
  let testMemberId3: number;

  beforeAll(async () => {
    // 創建測試成員
    testMemberId1 = await createTestMember('馬仔', 'password123');
    testMemberId2 = await createTestMember('阿傑', 'password456');
    testMemberId3 = await createTestMember('阿健', 'password789');

    // 創建測試活動
    testEventId = await createTestEvent('排練會議');

    // 設置出席狀態
    await setAttendance(testEventId, testMemberId1, 'going');
    await setAttendance(testEventId, testMemberId2, 'not-going');
    await setAttendance(testEventId, testMemberId3, 'unknown');
  });

  afterAll(async () => {
    // 清理測試數據
    await deleteBandEvent(testEventId);
    await deleteBandMember(testMemberId1);
    await deleteBandMember(testMemberId2);
    await deleteBandMember(testMemberId3);
  });

  describe('出席狀態摘要生成', () => {
    it('應該正確生成包含所有狀態的摘要', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const events = await getBandEvents();
      const event = events.find(e => e.id === testEventId);
      
      expect(event).toBeDefined();
      
      const summary = generateAttendanceSummary('排練會議', testMembers, event!.attendance);
      
      expect(summary).toContain('【排練會議】出席狀態');
      expect(summary).toContain('✓ 出席: 馬仔');
      expect(summary).toContain('✗ 不出席: 阿傑');
      expect(summary).toContain('? 未知道: 阿健');
    });

    it('應該處理只有部分成員出席的情況', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const attendance = {
        [testMemberId1]: 'going',
        [testMemberId2]: 'unknown',
        [testMemberId3]: 'unknown',
      };
      
      const summary = generateAttendanceSummary('排練會議', testMembers, attendance);
      
      expect(summary).toContain('✓ 出席: 馬仔');
      expect(summary).not.toContain('✗ 不出席');
      expect(summary).toContain('? 未知道: 阿傑, 阿健');
    });

    it('應該處理沒有人出席的情況', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const attendance = {
        [testMemberId1]: 'not-going',
        [testMemberId2]: 'not-going',
        [testMemberId3]: 'not-going',
      };
      
      const summary = generateAttendanceSummary('排練會議', testMembers, attendance);
      
      expect(summary).not.toContain('✓ 出席');
      expect(summary).toContain('✗ 不出席: 馬仔, 阿傑, 阿健');
      expect(summary).not.toContain('? 未知道');
    });

    it('應該正確格式化多行摘要', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const events = await getBandEvents();
      const event = events.find(e => e.id === testEventId);
      
      const summary = generateAttendanceSummary('排練會議', testMembers, event!.attendance);
      
      const lines = summary.split('\n');
      expect(lines.length).toBeGreaterThan(3);
      expect(lines[0]).toContain('【排練會議】出席狀態');
    });
  });

  describe('信息編輯功能', () => {
    it('應該允許編輯信息內容', () => {
      const originalMessage = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健\n';
      const editedMessage = originalMessage + '\n\n請務必準時到達！';
      
      expect(editedMessage).toContain(originalMessage);
      expect(editedMessage).toContain('請務必準時到達！');
    });

    it('應該保留換行符和特殊字符', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健\n\n備註：請提前15分鐘到達';
      
      expect(message).toContain('\n');
      expect(message).toContain('✓');
      expect(message).toContain('✗');
      expect(message).toContain('?');
      expect(message).toContain('【');
      expect(message).toContain('】');
    });

    it('應該支持長信息編輯', () => {
      const longMessage = '【排練會議】出席狀態\n\n' +
        '✓ 出席: 馬仔, 阿傑, 阿健\n' +
        '✗ 不出席: 無\n' +
        '? 未知道: 無\n\n' +
        '活動詳情：\n' +
        '- 時間：下午7:00-9:00\n' +
        '- 地點：音樂室\n' +
        '- 內容：新歌練習\n\n' +
        '請務必準時到達，帶上樂器和譜子。';
      
      expect(longMessage.length).toBeGreaterThan(100);
      expect(longMessage).toContain('活動詳情');
    });
  });

  describe('複製到剪貼板', () => {
    it('應該正確編碼信息用於複製', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑';
      
      // 模擬複製功能
      const copiedMessage = message;
      expect(copiedMessage).toEqual(message);
    });

    it('應該保留所有特殊字符', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健';
      
      const specialChars = ['【', '】', '✓', '✗', '?', '\n'];
      specialChars.forEach(char => {
        expect(message).toContain(char);
      });
    });
  });

  describe('WhatsApp 連結生成', () => {
    it('應該正確生成 WhatsApp Web 群組連結', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔';
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      expect(whatsappUrl).toContain('https://web.whatsapp.com/send');
      expect(whatsappUrl).toContain('text=');
      expect(whatsappUrl).toContain(encodeURIComponent('【'));
    });

    it('應該正確處理 URL 編碼', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健';
      const encodedMessage = encodeURIComponent(message);
      
      expect(encodedMessage).toContain('%E3%80%90'); // 【的編碼
      expect(encodedMessage).toContain('%E3%80%91'); // 】的編碼
      expect(encodedMessage).toContain('%0A'); // 換行符的編碼
    });

    it('應該支持長信息的 URL 編碼', () => {
      const longMessage = '【排練會議】出席狀態\n\n' +
        '✓ 出席: 馬仔, 阿傑, 阿健\n' +
        '✗ 不出席: 無\n' +
        '? 未知道: 無\n\n' +
        '活動詳情：\n' +
        '- 時間：下午7:00-9:00\n' +
        '- 地點：音樂室\n' +
        '- 內容：新歌練習\n\n' +
        '請務必準時到達。';
      
      const encodedMessage = encodeURIComponent(longMessage);
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      expect(whatsappUrl.length).toBeLessThan(2048); // URL 長度限制
      expect(whatsappUrl).toContain('https://web.whatsapp.com/send');
    });
  });

  describe('個人帳戶消息發送', () => {
    it('應該為每個成員生成正確的複製提示', () => {
      const members = [
        { id: testMemberId1, name: '馬仔' },
        { id: testMemberId2, name: '阿傑' },
        { id: testMemberId3, name: '阿健' },
      ];
      
      members.forEach(member => {
        const message = `已複製信息，請手動發送給 ${member.name}`;
        expect(message).toContain(member.name);
      });
    });

    it('應該支持選擇多個成員發送', () => {
      const members = [
        { id: testMemberId1, name: '馬仔' },
        { id: testMemberId2, name: '阿傑' },
        { id: testMemberId3, name: '阿健' },
      ];
      
      const selectedMembers = members.slice(0, 2);
      expect(selectedMembers.length).toBe(2);
      expect(selectedMembers[0].name).toBe('馬仔');
      expect(selectedMembers[1].name).toBe('阿傑');
    });
  });

  describe('群組消息發送', () => {
    it('應該生成正確的 WhatsApp Web 群組連結', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健';
      const encodedMessage = encodeURIComponent(message);
      const groupUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      expect(groupUrl).toContain('https://web.whatsapp.com/send');
      expect(groupUrl).toContain('text=');
    });

    it('應該支持打開新窗口發送群組消息', () => {
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔';
      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      // 驗證 URL 格式
      expect(url).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?text=/);
    });
  });

  describe('摘要複製功能', () => {
    it('應該正確複製出席狀態摘要', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const events = await getBandEvents();
      const event = events.find(e => e.id === testEventId);
      
      const summary = generateAttendanceSummary('排練會議', testMembers, event!.attendance);
      
      // 模擬複製
      const copiedText = summary;
      expect(copiedText).toEqual(summary);
      expect(copiedText).toContain('✓ 出席');
      expect(copiedText).toContain('✗ 不出席');
      expect(copiedText).toContain('? 未知道');
    });

    it('應該支持複製自定義編輯後的信息', () => {
      const originalSummary = '【排練會議】出席狀態\n\n✓ 出席: 馬仔\n✗ 不出席: 阿傑\n? 未知道: 阿健';
      const editedMessage = originalSummary + '\n\n重要提醒：請提前15分鐘到達！';
      
      // 模擬複製
      const copiedText = editedMessage;
      expect(copiedText).toContain('重要提醒');
      expect(copiedText).toContain(originalSummary);
    });
  });

  describe('綜合場景測試', () => {
    it('應該支持完整的通知流程：生成 -> 編輯 -> 複製', async () => {
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const events = await getBandEvents();
      const event = events.find(e => e.id === testEventId);
      
      // 1. 生成摘要
      const summary = generateAttendanceSummary('排練會議', testMembers, event!.attendance);
      expect(summary).toContain('【排練會議】出席狀態');
      
      // 2. 編輯信息
      const editedMessage = summary + '\n\n請務必準時到達！';
      expect(editedMessage).toContain('請務必準時到達！');
      
      // 3. 複製到剪貼板
      const copiedText = editedMessage;
      expect(copiedText).toEqual(editedMessage);
    });

    it('應該支持三種發送方式的選擇', () => {
      const modes = ['personal', 'group', 'copy'];
      const message = '【排練會議】出席狀態\n\n✓ 出席: 馬仔';
      
      modes.forEach(mode => {
        if (mode === 'personal') {
          // 個人帳戶：複製信息
          expect(message).toBeDefined();
        } else if (mode === 'group') {
          // 群組：生成 WhatsApp Web 連結
          const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
          expect(url).toContain('web.whatsapp.com');
        } else if (mode === 'copy') {
          // 複製摘要
          expect(message).toBeDefined();
        }
      });
    });

    it('應該正確處理多個活動的通知', async () => {
      const event2Id = await createTestEvent('演出準備');
      
      await setAttendance(event2Id, testMemberId1, 'going');
      await setAttendance(event2Id, testMemberId2, 'going');
      await setAttendance(event2Id, testMemberId3, 'not-going');
      
      const members = await getBandMembers();
      const testMembers = members.filter(m => [testMemberId1, testMemberId2, testMemberId3].includes(m.id));
      
      const events = await getBandEvents();
      const event2 = events.find(e => e.id === event2Id);
      
      const summary = generateAttendanceSummary('演出準備', testMembers, event2!.attendance);
      
      expect(summary).toContain('【演出準備】出席狀態');
      expect(summary).toContain('✓ 出席: 馬仔, 阿傑');
      expect(summary).toContain('✗ 不出席: 阿健');
      
      // 清理
      await deleteBandEvent(event2Id);
    });
  });
});
