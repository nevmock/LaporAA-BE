const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");
dayjs.extend(isoWeek);

router.get("/efisiensi", dashboardController.getEfisiensi);
router.get("/effectiveness", dashboardController.getEffectiveness);
router.get("/distribusi", dashboardController.getDistribusi);
router.get("/kepuasan", dashboardController.getKepuasan);
router.get('/harian', dashboardController.getDailyReportCount);
router.get('/wilayah-summary', dashboardController.getWilayahSummary);
router.get('/status-summary', dashboardController.getStatusSummary);

router.get("/perangkat-daerah-summary", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week } = req.query;

        if (!year) {
            return res.status(400).json({ message: "Parameter 'year' diperlukan" });
        }

        let startDate, endDate;

        if (mode === "yearly") {
            startDate = dayjs(`${year}-01-01`).startOf("day").toDate();
            endDate = dayjs(`${year}-12-31`).endOf("day").toDate();
        } else if (mode === "monthly") {
            if (!month) return res.status(400).json({ message: "Parameter 'month' diperlukan" });
            startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
            endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();
        } else if (mode === "weekly") {
            if (!month || !week) {
                return res.status(400).json({ message: "Parameter 'month' dan 'week' diperlukan untuk mode 'weekly'" });
            }

            const firstDayOfMonth = dayjs(`${year}-${month}-01`);
            let startOfWeek = firstDayOfMonth.startOf('week').add(1, 'day'); // Mulai dari Senin
            for (let i = 1; i < week; i++) {
                startOfWeek = startOfWeek.add(1, 'week');
            }

            startDate = startOfWeek.startOf("day").toDate();
            endDate = startOfWeek.endOf("week").endOf("day").toDate();
        } else {
            return res.status(400).json({ message: "Mode tidak valid" });
        }

        // Memastikan array opd diperlakukan dengan benar
        const data = await Tindakan.aggregate([
            {
                $match: {
                    status: { $in: ["Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan"] },
                    opd: { $exists: true, $ne: [] }, // Memastikan opd ada dan tidak kosong
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $unwind: "$opd" // Memecah array opd untuk menghitung setiap entri
            },
            {
                $group: {
                    _id: "$opd", // Mengelompokkan berdasarkan nilai OPD
                    total: { $sum: 1 } // Menghitung total kemunculan setiap OPD
                }
            },
            {
                $sort: { total: -1 } // Mengurutkan berdasarkan jumlah terbanyak
            }
        ]);

        // Mengubah hasil menjadi format yang lebih mudah digunakan di frontend
        const result = {};
        data.forEach(d => {
            // Memastikan _id tidak null atau undefined
            if (d._id) {
                result[d._id] = d.total;
            }
        });

        return res.json(result);
    } catch (err) {
        console.error("Error fetching opd summary:", err);
        return res.status(500).json({ message: "Terjadi kesalahan" });
    }
});

router.get("/map", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week, status } = req.query;

        const matchStage = {
            createdAt: {},
        };

        const now = new Date();
        const inputYear = parseInt(year) || now.getFullYear();
        const inputMonth = parseInt(month) || now.getMonth() + 1;
        const inputWeek = parseInt(week) || 1;

        const startOf = (unit) => {
            if (unit === "month") return new Date(inputYear, inputMonth - 1, 1);
            if (unit === "year") return new Date(inputYear, 0, 1);
            return new Date(); // fallback
        };

        const endOf = (unit) => {
            if (unit === "month") return new Date(inputYear, inputMonth, 0, 23, 59, 59);
            if (unit === "year") return new Date(inputYear, 11, 31, 23, 59, 59);
            return new Date(); // fallback
        };

        // Tentukan range tanggal berdasarkan mode
        if (mode === "yearly") {
            matchStage.createdAt = {
                $gte: startOf("year"),
                $lte: endOf("year"),
            };
        } else if (mode === "monthly") {
            matchStage.createdAt = {
                $gte: startOf("month"),
                $lte: endOf("month"),
            };
        } else if (mode === "weekly") {
            const firstOfMonth = new Date(inputYear, inputMonth - 1, 1);
            const firstWeekday = firstOfMonth.getDay() === 0 ? 1 : 0; // start on Monday
            const start = new Date(inputYear, inputMonth - 1, 1 - firstWeekday + 7 * (inputWeek - 1));
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59);
            matchStage.createdAt = { $gte: start, $lte: end };
        }

        const basePipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan",
                },
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true,
                },
            },

            ...(status && status !== "Semua Status"
                ? [
                    {
                        $match: {
                            "tindakan.status": status,
                        },
                    },
                ]
                : []),

            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0],
                    },
                    statusScore: {
                        $indexOfArray: [
                            [
                                "Perlu Verifikasi",
                                "Verifikasi Situasi",
                                "Verifikasi Kelengkapan Berkas",
                                "Proses OPD Terkait",
                                "Selesai Penanganan",
                                "Selesai Pengaduan",
                                "Ditutup",
                            ],
                            "$tindakan.status",
                        ],
                    },
                },
            },
            {
                $sort: {
                    prioritasScore: -1,
                    statusScore: 1,
                    createdAt: -1,
                },
            },
        ];

        const reports = await Report.aggregate(basePipeline);
        const populatedReports = await Report.populate(reports, { path: "user" });

        res.status(200).json({
            totalReports: populatedReports.length,
            data: populatedReports,
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/summary-dashboard", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week } = req.query;

        let matchStage = {};
        let previousMatchStage = {};
        
        // Mode ALL
        if (mode === "all") {
            // Tidak ada filter tanggal
        } else {
            if (!year) {
                return res.status(400).json({ message: "Parameter 'year' diperlukan" });
            }

            let startDate, endDate, previousStartDate, previousEndDate;
            if (mode === "yearly") {
                startDate = dayjs(`${year}-01-01`).startOf("day").toDate();
                endDate = dayjs(`${year}-12-31`).endOf("day").toDate();
                previousStartDate = dayjs(`${year - 1}-01-01`).startOf("day").toDate();
                previousEndDate = dayjs(`${year - 1}-12-31`).endOf("day").toDate();
            } else if (mode === "monthly") {
                if (!month) return res.status(400).json({ message: "Parameter 'month' diperlukan" });
                startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
                endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();
                
                // Previous month calculation
                const currentMonth = dayjs(`${year}-${month}-01`);
                const previousMonth = currentMonth.subtract(1, 'month');
                previousStartDate = previousMonth.startOf("month").toDate();
                previousEndDate = previousMonth.endOf("month").toDate();
            } else if (mode === "weekly") {
                if (!month || !week) {
                    return res.status(400).json({ message: "Parameter 'month' dan 'week' diperlukan untuk mode 'weekly'" });
                }
                const firstDayOfMonth = dayjs(`${year}-${month}-01`);
                let startOfWeek = firstDayOfMonth.startOf('week').add(1, 'day'); // Senin
                for (let i = 1; i < week; i++) {
                    startOfWeek = startOfWeek.add(1, 'week');
                }
                startDate = startOfWeek.startOf("day").toDate();
                endDate = startOfWeek.endOf("week").endOf("day").toDate();
                
                // Previous week calculation
                const previousWeekStart = startOfWeek.subtract(1, 'week');
                previousStartDate = previousWeekStart.startOf("day").toDate();
                previousEndDate = previousWeekStart.endOf("week").endOf("day").toDate();
            } else {
                return res.status(400).json({ message: "Mode tidak valid" });
            }

            matchStage = { "tindakan.createdAt": { $gte: startDate, $lte: endDate } };
            previousMatchStage = { "tindakan.createdAt": { $gte: previousStartDate, $lte: previousEndDate } };
        }

        // Current period data
        const pipeline = [
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },
        ];
        if (mode !== "all") {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push({
            $group: {
                _id: "$tindakan.status",
                count: { $sum: 1 }
            }
        });

        const summary = await Report.aggregate(pipeline);

        // Previous period data (only if not "all" mode)
        let previousSummary = [];
        if (mode !== "all") {
            const previousPipeline = [
                {
                    $lookup: {
                        from: "tindakans",
                        localField: "tindakan",
                        foreignField: "_id",
                        as: "tindakan"
                    }
                },
                { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },
                { $match: previousMatchStage },
                {
                    $group: {
                        _id: "$tindakan.status",
                        count: { $sum: 1 }
                    }
                }
            ];
            previousSummary = await Report.aggregate(previousPipeline);
        }

        const result = {};
        const previousResult = {};
        
        // Process current period
        summary.forEach(item => {
            result[item._id || "Tanpa Status"] = item.count;
        });

        // Process previous period
        previousSummary.forEach(item => {
            previousResult[item._id || "Tanpa Status"] = item.count;
        });

        // Calculate trends for each status
        const trendsResult = {};
        const allStatuses = [
            "Perlu Verifikasi", "Verifikasi Situasi", "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan", "Ditutup"
        ];

        allStatuses.forEach(status => {
            const current = result[status] || 0;
            const previous = previousResult[status] || 0;
            
            let trend = 0;
            if (previous > 0) {
                trend = ((current - previous) / previous * 100);
            } else if (current > 0) {
                trend = 100; // 100% increase if previous was 0
            }
            
            trendsResult[status] = {
                current: current,
                previous: previous,
                trend: Math.round(trend * 100) / 100 // Round to 2 decimal places
            };
        });

        res.status(200).json({
            current: result,
            trends: trendsResult
        });
    } catch (error) {
        console.error("❌ Error summary-dashboard:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Helper function to build search conditions including trackingId
function buildSearchConditions(searchQuery) {
    const baseConditions = [
        { sessionId: { $regex: searchQuery, $options: "i" } },
        { from: { $regex: searchQuery, $options: "i" } },
        { "location.desa": { $regex: searchQuery, $options: "i" } },
        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
        { "user.name": { $regex: searchQuery, $options: "i" } },
        { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
        { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
        { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
        { "tags": { $regex: searchQuery, $options: "i" } },
        { "processed_by": { $regex: searchQuery, $options: "i" } }
    ];

    // Handle trackingId search - both as number and string
    const numericSearch = parseInt(searchQuery);
    if (!isNaN(numericSearch)) {
        // Exact match for numeric trackingId
        baseConditions.push({ "tindakan.trackingId": numericSearch });
    }

    // Partial match using string conversion (for searching partial numbers)
    baseConditions.push({ 
        $expr: { 
            $regexMatch: { 
                input: { 
                    $toString: {
                        $ifNull: ["$tindakan.trackingId", ""]
                    }
                }, 
                regex: searchQuery, 
                options: "i" 
            } 
        } 
    });

    return baseConditions;
}

router.get("/new", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;
        const searchQuery = req.query.search?.trim();
        const rawSorts = req.query.sorts;
        const opdFilter = req.query.opd?.trim();
        const situasiFilter = req.query.situasi?.trim();

        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditutup"
        ];

        let sortArray = [];
        try {
            sortArray = rawSorts ? JSON.parse(rawSorts) : [];
        } catch (err) {
            console.warn("Invalid sorts param:", err);
        }

        const sortObject = {};
        for (const { key, order } of sortArray) {
            const sortVal = order === "asc" ? 1 : -1;
            switch (key) {
                case "prioritas": sortObject["prioritasScore"] = sortVal; break;
                case "status": sortObject["statusScore"] = sortVal; break;
                case "situasi": sortObject["tindakan.situasi"] = sortVal; break;
                case "lokasi_kejadian": sortObject["location.desa"] = sortVal; break;
                case "opd": sortObject["tindakan.opd"] = sortVal; break;
                case "timer":
                case "date": sortObject["createdAt"] = sortVal; break;
                case "admin": sortObject["processed_by.nama_admin"] = sortVal; break;
                case "from": sortObject["from"] = sortVal; break;
                default: sortObject[key] = sortVal;
            }
        }
        if (Object.keys(sortObject).length === 0) {
            sortObject["prioritasScore"] = -1;
            sortObject["statusScore"] = 1;
            sortObject["createdAt"] = -1;
        }

        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: buildSearchConditions(searchQuery)
                }
            }] : []),
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
        ];

        // Main pipeline for data
        const pipeline = [
            ...basePipeline,
            { $sort: sortObject },
            { $skip: skip },
            { $limit: limit }
        ];
        // Count pipeline
        const countPipeline = [
            ...basePipeline,
            { $count: "total" }
        ];

        // Dynamic breakdown pipelines - exclude the current filter being calculated
        // Status breakdown (exclude status filter to show all possible status counts)
        const statusBreakdownBasePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: buildSearchConditions(searchQuery)
                }
            }] : []),
            // Include OPD filter for status breakdown
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            // Include situasi filter for status breakdown
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
        ];

        // OPD breakdown (exclude OPD filter to show all possible OPD counts)
        // PERBAIKAN: Tidak menggunakan $unwind untuk menghitung laporan unik per OPD
        const opdBreakdownBasePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: buildSearchConditions(searchQuery)
                }
            }] : []),
            // Include status filter for OPD breakdown
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            // Include situasi filter for OPD breakdown
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
            // Filter hanya laporan yang memiliki OPD array yang tidak kosong
            {
                $match: {
                    "tindakan.opd": { $exists: true, $ne: [] }
                }
            }
        ];

        // Situasi breakdown (exclude situasi filter to show all possible situasi counts)
        const situasiBreakdownBasePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: buildSearchConditions(searchQuery)
                }
            }] : []),
            // Include status filter for situasi breakdown
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            // Include OPD filter for situasi breakdown
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
        ];

        const statusBreakdownPipeline = [
            ...statusBreakdownBasePipeline,
            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            }
        ];
        
        // PERBAIKAN: Pipeline OPD breakdown yang benar
        // Menghitung berapa banyak laporan UNIK yang mengandung setiap OPD
        const opdBreakdownPipeline = [
            ...opdBreakdownBasePipeline,
            // Buat field baru yang berisi semua OPD sebagai set untuk tracking laporan unik
            {
                $addFields: {
                    "uniqueReportId": "$_id" // ID laporan untuk memastikan keunikan
                }
            },
            // Unwind hanya untuk grouping, bukan untuk counting laporan
            { 
                $unwind: { 
                    path: "$tindakan.opd", 
                    preserveNullAndEmptyArrays: false 
                } 
            },
            // Group berdasarkan OPD, tapi hitung laporan unik (bukan kemunculan OPD)
            {
                $group: {
                    _id: "$tindakan.opd",
                    uniqueReports: { $addToSet: "$uniqueReportId" } // Set laporan unik
                }
            },
            // Hitung ukuran set untuk mendapatkan jumlah laporan unik
            {
                $addFields: {
                    count: { $size: "$uniqueReports" }
                }
            },
            // Project untuk format yang konsisten
            {
                $project: {
                    _id: 1,
                    count: 1
                }
            }
        ];
        
        const situasiBreakdownPipeline = [
            ...situasiBreakdownBasePipeline,
            {
                $group: {
                    _id: "$tindakan.situasi",
                    count: { $sum: 1 }
                }
            }
        ];

        // Parallel fetch
        const [
            reports,
            countResult,
            statusBreakdown,
            opdBreakdown,
            situasiBreakdown
        ] = await Promise.all([
            Report.aggregate(pipeline),
            Report.aggregate(countPipeline),
            Report.aggregate(statusBreakdownPipeline),
            Report.aggregate(opdBreakdownPipeline),
            Report.aggregate(situasiBreakdownPipeline)
        ]);
        const totalReports = countResult[0]?.total || 0;

        // Format breakdown with dynamic counts
        const statusResult = {};
        statusBreakdown.forEach(item => {
            if (item._id) statusResult[item._id] = item.count;
        });
        
        const opdResult = {};
        opdBreakdown.forEach(item => {
            if (item._id) opdResult[item._id] = item.count;
        });
        
        const situasiResult = {};
        situasiBreakdown.forEach(item => {
            if (item._id) situasiResult[item._id] = item.count;
        });

        // Calculate totals for each breakdown (for reference)
        const statusTotal = Object.values(statusResult).reduce((sum, count) => sum + count, 0);
        const opdTotal = Object.values(opdResult).reduce((sum, count) => sum + count, 0);
        const situasiTotal = Object.values(situasiResult).reduce((sum, count) => sum + count, 0);

        res.status(200).json({
            page,
            limit,
            totalPages: Math.ceil(totalReports / limit),
            totalReports,
            data: reports,
            summary: {
                status: statusResult,
                opd: opdResult,
                situasi: situasiResult
            },
            breakdownTotals: {
                status: statusTotal,
                opd: opdTotal,
                situasi: situasiTotal
            },
            activeFilters: {
                search: searchQuery || null,
                status: statusFilter || null,
                opd: opdFilter || null,
                situasi: situasiFilter || null,
                is_pinned: typeof req.query.is_pinned !== "undefined" ? req.query.is_pinned === "true" : null
            }
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// API endpoint untuk mendapatkan data bulan/periode yang memiliki data
router.get('/available-periods', async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const parsedYear = parseInt(year);

        // Get months with data for the given year
        const monthsWithData = await Report.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(parsedYear, 0, 1),
                        $lt: new Date(parsedYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get years with data (last 5 years from current year)
        const currentYear = new Date().getFullYear();
        const yearsToCheck = Array.from({ length: 5 }, (_, i) => currentYear - i);
        
        const yearsWithData = await Report.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Math.min(...yearsToCheck), 0, 1),
                        $lt: new Date(Math.max(...yearsToCheck) + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $year: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Return available periods
        res.json({
            availableMonths: monthsWithData.map(item => item._id),
            availableYears: yearsWithData.map(item => item._id),
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear()
        });

    } catch (error) {
        console.error('Error fetching available periods:', error);
        res.status(500).json({ 
            message: 'Error fetching available periods',
            availableMonths: [],
            availableYears: [],
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear()
        });
    }
});

module.exports = router;
