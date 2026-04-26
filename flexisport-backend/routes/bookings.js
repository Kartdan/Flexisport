const express = require("express");
const Booking = require("../models/Booking");
const Court = require("../models/Court");
const Flag = require("../models/Flag");
const Notification = require("../models/Notification");
const BlockedSlot = require("../models/BlockedSlot");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Check availability: count active bookings on that court/date that overlap [startTime, endTime]
// Two intervals overlap if startA < endB && endA > startB (string comparison works for "HH:MM")
function countOverlapping(bookings, startTime, endTime) {
  return bookings.filter(b => b.startTime < endTime && b.endTime > startTime).length;
}

// Returns true if the time range [startTime, endTime] is covered by any blocked slot on that date
function isBlockedBySlot(blockedSlots, startTime, endTime) {
  return blockedSlots.some(b => {
    if (!b.startTime) return true; // all-day block
    return b.startTime < endTime && b.endTime > startTime;
  });
}

function addWeeks(dateStr, weeks) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + weeks * 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// GET /api/bookings/mine
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id, status: "active" })
      .populate("court", "name address pricePerHour sportCategories")
      .sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/availability?courtId=&date=&startTime=&endTime=
router.get("/availability", verifyToken, async (req, res) => {
  try {
    const { courtId, date, startTime, endTime } = req.query;
    if (!courtId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "courtId, date, startTime and endTime are required" });
    }

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ error: "Court not found" });

    const existing = await Booking.find({ court: courtId, date, status: "active" });
    const overlapping = countOverlapping(existing, startTime, endTime);
    const available = court.numberOfCourts - overlapping;

    res.json({ available, total: court.numberOfCourts, overlapping });
  } catch (err) {
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// POST /api/bookings
// Body: { courtId, date, startTime, endTime, repeatWeeks? }
// repeatWeeks = 1 (default) creates one booking; N > 1 creates one per week for N weeks.
// Always returns: { created: [...], skipped: [{ date, reason }] }
router.post("/", verifyToken, async (req, res) => {
  try {
    const { courtId, date, startTime, endTime, repeatWeeks } = req.body;
    if (!courtId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "courtId, date, startTime and endTime are required" });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: "Start time must be before end time" });
    }

    const weeks = Math.min(Math.max(parseInt(repeatWeeks) || 1, 1), 12);
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return res.status(400).json({ error: "Cannot book a date in the past" });
    }

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ error: "Court not found" });
    if (court.operationalStatus !== "open") {
      return res.status(400).json({ error: "This court is not currently available for booking" });
    }

    if (court.author) {
      const ban = await Flag.findOne({ owner: court.author, flaggedUser: req.user.id, denyBooking: true });
      if (ban) {
        return res.status(403).json({ error: "You are not allowed to book this court." });
      }
    }

    const created = [];
    const skipped = [];

    for (let i = 0; i < weeks; i++) {
      const d = addWeeks(date, i);
      const existing = await Booking.find({ court: courtId, date: d, status: "active" });
      const overlapping = countOverlapping(existing, startTime, endTime);
      if (overlapping >= court.numberOfCourts) {
        skipped.push({ date: d, reason: "Fully booked" });
        continue;
      }
      // Check blocked slots
      const blocked = await BlockedSlot.find({ court: courtId, date: d });
      if (isBlockedBySlot(blocked, startTime, endTime)) {
        skipped.push({ date: d, reason: "Blocked by court owner" });
        continue;
      }
      const b = await Booking.create({ user: req.user.id, court: courtId, date: d, startTime, endTime });
      created.push({ _id: b._id, date: b.date, startTime: b.startTime, endTime: b.endTime });
    }

    if (court.author && created.length > 0) {
      const dateLabel = created.length === 1
        ? created[0].date
        : `${created.length} dates starting ${created[0].date}`;
      await Notification.create({
        user: court.author,
        type: "booking_created",
        title: weeks > 1 ? "New Recurring Booking" : "New Booking",
        message: `A booking has been made for "${court.name}" on ${dateLabel} from ${startTime} to ${endTime}.`,
        court: court._id
      });
    }

    res.status(201).json({ created, skipped });
  } catch (err) {
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/bookings/court/:courtId  — owner of that court, admin, or supervisor
router.get("/court/:courtId", verifyToken, async (req, res) => {
  try {
    const court = await Court.findById(req.params.courtId);
    if (!court) return res.status(404).json({ error: "Court not found" });

    const role = req.user.role;
    const isOwner = court.author.toString() === req.user.id;
    if (!isOwner && role !== "admin" && role !== "supervisor") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { date } = req.query; // optional filter
    const filter = { court: req.params.courtId, status: "active" };
    if (date) filter.date = date;

    const bookings = await Booking.find(filter)
      .populate("user", "username fullName email")
      .sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch court bookings" });
  }
});

// DELETE /api/bookings/:id  (cancel by booker, or reject by court owner/admin/supervisor)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("court");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const userId = String(req.user.id || req.user._id);
    const isBooker = booking.user.equals(userId);
    const court = booking.court;
    const isCourtOwner = court && court.author && court.author.equals(userId);
    const isPrivileged = ["admin", "supervisor"].includes(req.user.role);

    if (!isBooker && !isCourtOwner && !isPrivileged) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Enforce cancellation notice period for the booker (owners/admin/supervisor are exempt)
    if (isBooker && !isCourtOwner && !isPrivileged) {
      // Re-fetch court directly to ensure cancellationNoticeHours is present (populate may omit new fields)
      const courtDoc = await require("../models/Court").findById(court._id);
      const noticeHours = courtDoc?.cancellationNoticeHours ?? 0;

      if (noticeHours > 0) {
        const now = new Date();
        const [bYear, bMonth, bDay] = booking.date.split("-").map(Number);
        const [bHour, bMin] = booking.startTime.split(":").map(Number);

        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const bookingDateLocal = new Date(bYear, bMonth - 1, bDay);
        const dayDiff = (bookingDateLocal - todayLocal) / (1000 * 60 * 60 * 24);

        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const bookingMinutes = bHour * 60 + bMin;
        const hoursUntilStart = dayDiff * 24 + (bookingMinutes - nowMinutes) / 60;

        if (hoursUntilStart < noticeHours) {
          return res.status(400).json({
            error: `This court requires at least ${noticeHours} hour${noticeHours !== 1 ? "s" : ""} notice to cancel. Your booking starts in ${Math.max(0, hoursUntilStart).toFixed(1)} hour(s).`
          });
        }
      }
    }

    booking.status = "cancelled";
    await booking.save();

    // Notify court owner if cancellation was made by the booker (not by the owner themselves)
    if (court && court.author && !isCourtOwner && !isPrivileged) {
      await Notification.create({
        user: court.author,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `A booking for "${court.name}" on ${booking.date} from ${booking.startTime} to ${booking.endTime} has been cancelled by the user.`,
        court: court._id
      });
    }

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// GET /api/bookings/slots?courtId=&date=  — returns booked time ranges + blocked slots for a court on a date
router.get("/slots", verifyToken, async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) {
      return res.status(400).json({ error: "courtId and date are required" });
    }
    const [bookings, blocked] = await Promise.all([
      Booking.find({ court: courtId, date, status: "active" }, "startTime endTime"),
      BlockedSlot.find({ court: courtId, date }, "startTime endTime reason")
    ]);
    res.json({ bookings, blocked });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

module.exports = router;
