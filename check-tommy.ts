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
  console.log('4 月 10 日的活動：', events.map(e => `${e.title} (ID: ${e.id})`));
  
  // 查詢 Tommy
  const tommy = await db.select().from(bandMembers).where(eq(bandMembers.name, 'Tommy'));
  console.log('Tommy:', tommy.map(t => `${t.name} (ID: ${t.id})`));

  if (events.length > 0 && tommy.length > 0) {
    const eventId = events[0].id;
    const tommyId = tommy[0].id;

    // 查詢 Tommy 的出席狀態
    const attendance = await db
      .select()
      .from(bandAttendance)
      .where(and(
        eq(bandAttendance.eventId, eventId),
        eq(bandAttendance.memberId, tommyId)
      ));

    console.log('Tommy 的出席狀態：', attendance);
  }
}

main().catch(console.error);
