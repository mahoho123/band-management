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
  
  // 查詢 Tommy
  const tommy = await db.select().from(bandMembers).where(eq(bandMembers.name, 'Tommy'));

  if (events.length > 0 && tommy.length > 0) {
    const tommyId = tommy[0].id;

    for (const event of events) {
      // 更新出席狀態為 'going'
      await db
        .update(bandAttendance)
        .set({ status: 'going', updatedAt: new Date() })
        .where(and(
          eq(bandAttendance.eventId, event.id),
          eq(bandAttendance.memberId, tommyId)
        ));

      console.log(`✅ 已更新 Tommy 在「${event.title}」的出席狀態為「出席」`);
    }
  }
}

main().catch(console.error);
