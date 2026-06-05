const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const EMR = require('../models/EMR');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Generate Revenue Report
// @route   GET /api/v1/reports/revenue
// @access  Private/Admin/Cashier
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { status: 'paid' };

  if (startDate && endDate) {
    filter.updatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const revenueData = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
        total: { $sum: "$paidAmount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: revenueData
  });
});

// @desc    Generate Patient Statistics Report
// @route   GET /api/v1/reports/patients
// @access  Private/Admin
exports.getPatientStats = asyncHandler(async (req, res) => {
  const [genderDist, ageDist] = await Promise.all([
    Patient.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]),
    Patient.aggregate([
      {
        $project: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                (365 * 24 * 60 * 60 * 1000)
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 35, 50, 65, 100],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: { genderDist, ageDist }
  });
});

// @desc    Generate Disease/Symptoms Trends
// @route   GET /api/v1/reports/trends
// @access  Private/Admin/Doctor
exports.getDiseaseTrends = asyncHandler(async (req, res) => {
  const trends = await EMR.aggregate([
    { $unwind: "$diagnosis" },
    {
      $group: {
        _id: "$diagnosis",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: trends
  });
});
