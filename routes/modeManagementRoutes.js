const express = require("express");
const router = express.Router();
const UserSession = require("../models/UserSession");
const AdminActivity = require("../models/AdminActivity");

// Model untuk Mode History
const mongoose = require("mongoose");

const modeHistorySchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["bot", "manual"],
    required: true,
  },
  previousMode: {
    type: String,
    enum: ["bot", "manual"],
  },
  changedBy: {
    type: String,
    required: true,
  },
  changedByType: {
    type: String,
    enum: ["admin", "system", "user"],
    default: "system",
  },
  reason: {
    type: String,
  },
  duration: {
    type: Number, // in minutes
  },
  forceMode: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
  },
}, {
  timestamps: true,
});

const ModeHistory = mongoose.model("ModeHistory", modeHistorySchema);

// Model untuk Mode Schedule
const modeScheduleSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["bot", "manual"],
    required: true,
  },
  startTime: {
    type: String, // Format: "HH:MM"
    required: true,
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: true,
  },
  recurring: {
    type: Boolean,
    default: false,
  },
  daysOfWeek: {
    type: [Number], // 0-6 (Sunday-Saturday)
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    default: "Asia/Jakarta",
  },
}, {
  timestamps: true,
});

const ModeSchedule = mongoose.model("ModeSchedule", modeScheduleSchema);

// Helper function to log mode changes
const logModeChange = async (from, newMode, previousMode, changedBy, reason, duration, forceMode = false) => {
  try {
    await ModeHistory.create({
      from,
      mode: newMode,
      previousMode,
      changedBy,
      changedByType: changedBy === 'system' ? 'system' : 'admin',
      reason,
      duration,
      forceMode,
    });
  } catch (error) {
    console.error('Failed to log mode change:', error);
  }
};

// GET /api/mode-management/history/:from - Get mode history for a user
router.get('/history/:from', async (req, res) => {
  try {
    const { from } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await ModeHistory.find({ from })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await ModeHistory.countDocuments({ from });
    
    res.json({
      history,
      total,
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });
  } catch (error) {
    console.error('Error fetching mode history:', error);
    res.status(500).json({ error: 'Failed to fetch mode history' });
  }
});

// GET /api/mode-management/history - Get mode history for all users (admin only)
router.get('/history', async (req, res) => {
  try {
    const { limit = 100, offset = 0, from } = req.query;
    
    const filter = from ? { from } : {};
    
    const history = await ModeHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await ModeHistory.countDocuments(filter);
    
    res.json({
      history,
      total,
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });
  } catch (error) {
    console.error('Error fetching mode history:', error);
    res.status(500).json({ error: 'Failed to fetch mode history' });
  }
});

// GET /api/mode-management/schedules/:from - Get mode schedules for a user
router.get('/schedules/:from', async (req, res) => {
  try {
    const { from } = req.params;
    
    const schedules = await ModeSchedule.find({ from })
      .sort({ createdAt: -1 });
    
    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching mode schedules:', error);
    res.status(500).json({ error: 'Failed to fetch mode schedules' });
  }
});

// POST /api/mode-management/schedules - Create a new mode schedule
router.post('/schedules', async (req, res) => {
  try {
    const { from, mode, startTime, endTime, recurring, daysOfWeek, createdBy } = req.body;
    
    // Validate required fields
    if (!from || !mode || !startTime || !endTime || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate mode
    if (!['bot', 'manual'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
    }
    
    const schedule = await ModeSchedule.create({
      from,
      mode,
      startTime,
      endTime,
      recurring: recurring || false,
      daysOfWeek: daysOfWeek || [],
      createdBy,
    });
    
    res.status(201).json({ 
      message: 'Schedule created successfully',
      schedule 
    });
  } catch (error) {
    console.error('Error creating mode schedule:', error);
    res.status(500).json({ error: 'Failed to create mode schedule' });
  }
});

// PUT /api/mode-management/schedules/:id - Update a mode schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active, ...updateData } = req.body;
    
    const schedule = await ModeSchedule.findByIdAndUpdate(
      id,
      { ...updateData, active },
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ 
      message: 'Schedule updated successfully',
      schedule 
    });
  } catch (error) {
    console.error('Error updating mode schedule:', error);
    res.status(500).json({ error: 'Failed to update mode schedule' });
  }
});

// DELETE /api/mode-management/schedules/:id - Delete a mode schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await ModeSchedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting mode schedule:', error);
    res.status(500).json({ error: 'Failed to delete mode schedule' });
  }
});

// POST /api/mode-management/bulk-mode-change - Bulk mode change for multiple users
router.post('/bulk-mode-change', async (req, res) => {
  try {
    const { users, mode, changedBy, reason, duration } = req.body;
    
    // Validate input
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }
    
    if (!['bot', 'manual'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    
    if (!changedBy) {
      return res.status(400).json({ error: 'changedBy is required' });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    // Process each user
    for (const from of users) {
      try {
        let session = await UserSession.findOne({ from });
        
        if (!session) {
          // Create new session if doesn't exist
          session = await UserSession.create({
            from,
            currentAction: null,
            step: "MAIN_MENU",
            data: {},
            mode: mode,
            manualModeUntil: mode === 'manual' && duration ? 
              new Date(Date.now() + duration * 60 * 1000) : null
          });
        } else {
          // Update existing session
          const previousMode = session.mode;
          session.mode = mode;
          
          if (mode === 'manual' && duration) {
            session.manualModeUntil = new Date(Date.now() + duration * 60 * 1000);
          } else if (mode === 'bot') {
            session.manualModeUntil = null;
          }
          
          await session.save();
          
          // Log the mode change
          await logModeChange(from, mode, previousMode, changedBy, reason, duration);
        }
        
        results.successful.push(from);
      } catch (error) {
        console.error(`Failed to update mode for user ${from}:`, error);
        results.failed.push({ from, error: error.message });
      }
    }
    
    res.json({
      message: `Bulk mode change completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    console.error('Error in bulk mode change:', error);
    res.status(500).json({ error: 'Failed to perform bulk mode change' });
  }
});

// GET /api/mode-management/statistics - Get mode statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalUsers = await UserSession.countDocuments();
    const botModeUsers = await UserSession.countDocuments({ mode: 'bot' });
    const manualModeUsers = await UserSession.countDocuments({ mode: 'manual' });
    const forceModeUsers = await UserSession.countDocuments({ forceModeManual: true });
    
    // Calculate average manual mode duration
    const manualSessions = await UserSession.find({ 
      mode: 'manual',
      manualModeUntil: { $exists: true, $ne: null }
    });
    
    let totalDuration = 0;
    let activeDurations = 0;
    
    manualSessions.forEach(session => {
      if (session.manualModeUntil) {
        const duration = Math.max(0, (session.manualModeUntil - session.updatedAt) / (1000 * 60));
        totalDuration += duration;
        activeDurations++;
      }
    });
    
    const averageManualDuration = activeDurations > 0 ? Math.round(totalDuration / activeDurations) : 0;
    
    // Get mode changes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const modeChangesToday = await ModeHistory.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Get mode distribution by hour (last 24 hours)
    const hourlyStats = await ModeHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { 
            hour: { $hour: "$createdAt" },
            mode: "$mode"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.hour": 1 }
      }
    ]);
    
    res.json({
      totalUsers,
      botModeUsers,
      manualModeUsers,
      forceModeUsers,
      averageManualDuration,
      modeChangesToday,
      hourlyStats
    });
  } catch (error) {
    console.error('Error fetching mode statistics:', error);
    res.status(500).json({ error: 'Failed to fetch mode statistics' });
  }
});

// GET /api/mode-management/active-users - Get list of active users with their current mode
router.get('/active-users', async (req, res) => {
  try {
    const { limit = 50, offset = 0, mode } = req.query;
    
    const filter = mode ? { mode } : {};
    
    const users = await UserSession.find(filter)
      .select('from mode manualModeUntil forceModeManual updatedAt')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await UserSession.countDocuments(filter);
    
    // Add effective mode for each user
    const usersWithEffectiveMode = users.map(user => ({
      ...user.toObject(),
      effectiveMode: user.getEffectiveMode()
    }));
    
    res.json({
      users: usersWithEffectiveMode,
      total,
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

// POST /api/mode-management/custom-duration - Set custom duration for manual mode
router.post('/custom-duration', async (req, res) => {
  try {
    const { from, duration, changedBy, reason } = req.body;
    
    // Validate input
    if (!from || !duration || !changedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (duration < 1 || duration > 480) { // Max 8 hours
      return res.status(400).json({ error: 'Duration must be between 1 and 480 minutes' });
    }
    
    let session = await UserSession.findOne({ from });
    
    if (!session) {
      // Create new session
      session = await UserSession.create({
        from,
        currentAction: null,
        step: "MAIN_MENU",
        data: {},
        mode: 'manual',
        manualModeUntil: new Date(Date.now() + duration * 60 * 1000)
      });
    } else {
      // Update existing session
      const previousMode = session.mode;
      session.mode = 'manual';
      session.manualModeUntil = new Date(Date.now() + duration * 60 * 1000);
      await session.save();
      
      // Log the mode change
      await logModeChange(from, 'manual', previousMode, changedBy, reason, duration);
    }
    
    res.json({
      message: `Manual mode activated for ${duration} minutes`,
      session: {
        from: session.from,
        mode: session.mode,
        manualModeUntil: session.manualModeUntil,
        effectiveMode: session.getEffectiveMode()
      }
    });
  } catch (error) {
    console.error('Error setting custom duration:', error);
    res.status(500).json({ error: 'Failed to set custom duration' });
  }
});

module.exports = router;
