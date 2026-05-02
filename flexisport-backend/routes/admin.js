const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Booking = require("../models/Booking");
const Court = require("../models/Court");
const User = require("../models/User");
const Tournament = require("../models/Tournament");

router.get("/analytics", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      courtsByStatus,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalTournaments,
      bookingsByMonth
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Court.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "active" }),
      Booking.countDocuments({ status: "cancelled" }),
      Tournament.countDocuments(),
      Booking.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: { $substr: ["$date", 0, 7] }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ])
    ]);

    // Revenue estimation from active bookings
    const activeBookingDocs = await Booking.find({ status: "active" })
      .populate("court", "pricePerHour");

    let totalRevenue = 0;
    const revenueByMonth = {};
    for (const b of activeBookingDocs) {
      if (!b.court || !b.court.pricePerHour) continue;
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      if (hours <= 0) continue;
      const rev = hours * b.court.pricePerHour;
      totalRevenue += rev;
      const month = b.date.substring(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] || 0) + rev;
    }

    // Top 5 courts by active booking count
    const topCourts = await Booking.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$court", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "courts",
          localField: "_id",
          foreignField: "_id",
          as: "courtInfo"
        }
      },
      { $unwind: { path: "$courtInfo", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          name: "$courtInfo.name",
          address: "$courtInfo.address",
          count: 1,
          pricePerHour: "$courtInfo.pricePerHour"
        }
      }
    ]);

    // Build last-6-months timeline
    const now = new Date();
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = bookingsByMonth.find(m => m._id === key);
      monthlyStats.push({
        month: key,
        bookings: found ? found.count : 0,
        revenue: Math.round(revenueByMonth[key] || 0)
      });
    }

    // Maps for convenience
    const roleMap = {};
    for (const r of usersByRole) roleMap[r._id] = r.count;

    const statusMap = {};
    for (const c of courtsByStatus) statusMap[c._id] = c.count;

    res.json({
      totals: {
        users: totalUsers,
        courts: {
          total: (statusMap.accepted || 0) + (statusMap.pending || 0) + (statusMap.rejected || 0),
          accepted: statusMap.accepted || 0,
          pending: statusMap.pending || 0,
          rejected: statusMap.rejected || 0
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          cancelled: cancelledBookings
        },
        tournaments: totalTournaments,
        revenue: Math.round(totalRevenue)
      },
      usersByRole: {
        player: roleMap.player || 0,
        owner: roleMap.owner || 0,
        supervisor: roleMap.supervisor || 0,
        admin: roleMap.admin || 0
      },
      monthlyStats,
      topCourts: topCourts.map(c => ({ name: c.name, address: c.address, bookings: c.count }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

module.exports = router;
