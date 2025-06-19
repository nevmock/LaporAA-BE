const efisiensiService = require('../services/efisiensiService');
const effectivenessService = require('../services/effectivenessService');
const distribusiService = require('../services/distribusiService');
const kepuasanService = require('../services/kepuasanService');
const Report = require('../models/Report');

// Removed duplicate Report require below

async function getEfisiensi(req, res) {
  try {
    const result = await efisiensiService.calculateEfisiensi();
    res.json(result);
  } catch (error) {
    console.error('Error calculating efisiensi:', error);
    res.status(500).json({ value: 0, updated_at: null });
  }
}

async function getEffectiveness(req, res) {
  try {
    const result = await effectivenessService.calculateEffectiveness();
    res.json(result);
  } catch (error) {
    console.error('Error calculating effectiveness:', error);
    res.status(500).json({ value: 0, updated_at: null });
  }
}

async function getDistribusi(req, res) {
  try {
    const result = await distribusiService.calculateDistribusi();
    res.json(result);
  } catch (error) {
    console.error('Error calculating distribusi solusi:', error);
    res.status(500).json({ value: 0, updated_at: null });
  }
}

async function getKepuasan(req, res) {
  try {
    const result = await kepuasanService.calculateKepuasan();
    res.json(result);
  } catch (error) {
    console.error('Error calculating kepuasan solusi:', error);
    res.status(500).json({ value: 0, updated_at: null });
  }
}

async function getDailyReportCount(req, res) {
  try {
    const { mode, year, month, week } = req.query;

    // Build date range filter based on mode
    let startDate, endDate;
    const y = parseInt(year);
    const m = parseInt(month);
    const w = parseInt(week);

    if (mode === 'yearly') {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y, 11, 31, 23, 59, 59, 999);
    } else if (mode === 'monthly') {
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1);
    } else if (mode === 'weekly') {
      // Calculate start of week (Monday) for given year, month, week
      const firstDayOfMonth = new Date(y, m - 1, 1);
      const dayOfWeek = firstDayOfMonth.getDay() || 7; // Sunday=0, convert to 7
      const firstMonday = new Date(firstDayOfMonth);
      firstMonday.setDate(firstDayOfMonth.getDate() + (8 - dayOfWeek));
      startDate = new Date(firstMonday);
      startDate.setDate(firstMonday.getDate() + (w - 1) * 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else {
      // Default to yearly if mode not recognized
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    }

    // Aggregate reports created within date range
    const groupId = mode === 'yearly'
      ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const result = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: groupId,
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (mode === 'yearly') {
      // Fill missing months with zero count
      const months = [];
      for (let i = 0; i < 12; i++) {
        const monthStr = `${y}-${(i + 1).toString().padStart(2, '0')}`;
        months.push(monthStr);
      }
      const resultMap = {};
      result.forEach(item => {
        resultMap[item._id] = item.total;
      });
      const filledResult = months.map(month => ({
        date: month,
        total: resultMap[month] || 0
      }));
      res.json(filledResult);
    } else {
      // Fill missing dates with zero count
      const dates = [];
      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        dates.push(currentDate.toISOString().slice(0, 10));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const resultMap = {};
      result.forEach(item => {
        resultMap[item._id] = item.total;
      });
      const filledResult = dates.map(date => ({
        date,
        total: resultMap[date] || 0
      }));
      res.json(filledResult);
    }
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data harian' });
  }
}

async function getWilayahSummary(req, res) {
  try {
    const { mode, year, month, week } = req.query;

    // Build date range filter based on mode
    let startDate, endDate;
    const y = parseInt(year);
    const m = parseInt(month);
    const w = parseInt(week);

    if (mode === 'yearly') {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    } else if (mode === 'monthly') {
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1);
    } else if (mode === 'weekly') {
      // Calculate start of week (Monday) for given year, month, week
      const firstDayOfMonth = new Date(y, m - 1, 1);
      const dayOfWeek = firstDayOfMonth.getDay() || 7; // Sunday=0, convert to 7
      const firstMonday = new Date(firstDayOfMonth);
      firstMonday.setDate(firstDayOfMonth.getDate() + (8 - dayOfWeek));
      startDate = new Date(firstMonday);
      startDate.setDate(firstMonday.getDate() + (w - 1) * 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else {
      // Default to yearly if mode not recognized
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    }

    // Aggregate reports created within date range
    const reports = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: {
            kabupaten: "$location.kabupaten",
            kecamatan: "$location.kecamatan",
            desa: "$location.desa"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Build nested structure kabupaten > kecamatan > desa
    const result = {};
    reports.forEach(r => {
      const { kabupaten, kecamatan, desa } = r._id;
      if (!result[kabupaten]) result[kabupaten] = {};
      if (!result[kabupaten][kecamatan]) result[kabupaten][kecamatan] = {};
      result[kabupaten][kecamatan][desa] = r.count;
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getWilayahSummary:', error);
    res.status(500).json({ message: 'Gagal mengambil data wilayah summary' });
  }
}

const Tindakan = require('../models/Tindakan');

async function getStatusSummary(req, res) {
  try {
    const { mode, year, month, week } = req.query;

    // Build date range filter based on mode
    let startDate, endDate;
    const y = parseInt(year);
    const m = parseInt(month);
    const w = parseInt(week);

    if (mode === 'yearly') {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    } else if (mode === 'monthly') {
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1);
    } else if (mode === 'weekly') {
      // Calculate start of week (Monday) for given year, month, week
      const firstDayOfMonth = new Date(y, m - 1, 1);
      const dayOfWeek = firstDayOfMonth.getDay() || 7; // Sunday=0, convert to 7
      const firstMonday = new Date(firstDayOfMonth);
      firstMonday.setDate(firstDayOfMonth.getDate() + (8 - dayOfWeek));
      startDate = new Date(firstMonday);
      startDate.setDate(firstMonday.getDate() + (w - 1) * 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else {
      // Default to yearly if mode not recognized
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    }

    // Aggregate tindakan joined with report filtered by report.createdAt date range
    const reports = await Tindakan.aggregate([
      {
        $lookup: {
          from: "reports",
          localField: "report",
          foreignField: "_id",
          as: "reportData"
        }
      },
      { $unwind: "$reportData" },
      {
        $match: {
          "reportData.createdAt": { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object with status as key and count as value
    const result = {};
    reports.forEach(r => {
      result[r._id] = r.count;
    });

    // Fill missing statuses with zero count
    const allStatuses = [
      "Perlu Verifikasi",
      "Verifikasi Situasi",
      "Verifikasi Kelengkapan Berkas",
      "Proses OPD Terkait",
      "Selesai Penanganan",
      "Selesai Pengaduan",
      "Ditutup",
    ];
    allStatuses.forEach(status => {
      if (!(status in result)) {
        result[status] = 0;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getStatusSummary:', error);
    res.status(500).json({ message: 'Gagal mengambil data status summary' });
  }
}

module.exports = {
  getEfisiensi,
  getEffectiveness,
  getDistribusi,
  getKepuasan,
  getDailyReportCount,
  getWilayahSummary,
  getStatusSummary
};
