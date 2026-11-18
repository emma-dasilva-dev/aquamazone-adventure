import { NextRequest, NextResponse } from 'next/server';
import { checkBookingWindow, RESERVATION_SLOTS } from '../../../../lib/reservation-rules';
import { equipmentAvailability, reservationCapacity } from '../../../../lib/db/equipment-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

type Supported = 'pedalo' | 'canoe' | 'pedalboat';
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const experience = params.get('experience');
  const date = params.get('date') ?? '';
  const time = params.get('time') ?? '';
  const adultRaw = params.get('adults') ?? '';
  const childRaw = params.get('children') ?? '';
  const adults = Number(adultRaw), children = Number(childRaw);
  const guests = adults + children;
  if (!['pedalo','canoe','pedalboat'].includes(experience ?? '') ||
      !checkBookingWindow(date).ok ||
      !(RESERVATION_SLOTS as readonly string[]).includes(time) ||
      !/^\d{1,2}$/.test(adultRaw) || !/^\d{1,2}$/.test(childRaw) ||
      !Number.isSafeInteger(guests) || guests < 1 || guests > 20 ||
      (children > 0 && adults < 1) ||
      (experience === 'pedalboat' && (guests < 2 || guests > 4))) {
    return NextResponse.json({status:'invalid',message:'Invalid selection or closed booking window.'},
      {status:422,headers});
  }
  try {
    const [equipment, capacity] = await Promise.all([
      equipmentAvailability({date,time,durationMinutes:30}),
      reservationCapacity({date,time})
    ]);
    const free = (kind:string) => equipment.find(row=>row.equipmentType===kind)?.availableUnits ?? 0;
    const kind = experience as Supported;
    let enough = false;
    if (kind === 'pedalboat') enough = free('pedal_boat') >= 1;
    else {
      const singles = free(kind+'_single');
      const doubles = free(kind+'_double');
      // Exactly fill seats; do not assume a double craft can be sold to one person.
      for (let pairs = 0; pairs <= Math.min(Math.floor(guests/2), doubles); pairs++) {
        if (guests - pairs * 2 <= singles) { enough = true; break; }
      }
    }
    const withinLimits =
      capacity.dailyReservations + 1 <= capacity.limitReservations &&
      capacity.dailyVisitors + guests <= capacity.limitVisitors &&
      capacity.slotVisitors + guests <= capacity.limitSlotVisitors;
    return NextResponse.json({
      status: enough && withinLimits ? 'available' : 'unavailable',
      checkedAt: new Date().toISOString(),
      provisional: true,
      message: 'Capacity snapshot only. Equipment is not held; enquiry is not a confirmed booking.'
    },{headers});
  } catch {
    // Fail closed: missing database credentials or query error must never mean available.
    return NextResponse.json({
      status:'unknown',message:'Availability cannot be checked right now.'
    },{status:503,headers});
  }
}
