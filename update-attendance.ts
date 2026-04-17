import { getDb } from './server/db';
import { bandEvents, bandMembers, bandAttendance } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.log('資料庫連接失敗');
    return;
  }

  // 查詢 4 月 10 日的活動
  const events = await db.select().from(bandEvents).where(eq(bandEvents.date, '2026-04-10'));
  console.log('4 月 10 日的活動數量：', events.length);
  events.forEach(e => console.log(`  - ${e.title} (ID: ${e.id})`));

  // 查詢 Howie
  const howie = await db.select().from(bandMembers).where(eq(bandMembers.name, 'Howie'));
  console.log('Howie ID:', howie.length > 0 ? howie[0].id : '未找到');

  if (events.length > 0 && howie.length > 0) {
    const howieId = howie[0].id;

    for (const event of events) {
      // 更新出席狀態為 'not-going'
      await db
        .update(bandAttendance)
        .set({ status: 'not-going', updatedAt: new Date() })
        .where(and(
          eq(bandAttendance.eventId, event.id),
          eq(bandAttendance.memberId, howieId)
        ));

      console.log(`✅ 已更新 Howie 在「${event.title}」的出席狀態為「不出席」`);
    }
  } else {
    console.log('❌ 找不到 4 月 10 日的活動或 Howie');
  }
}

main().catch(console.error);
