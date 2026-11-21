
const reportModel = require('../models/reportModel');

const getAllReports = async (req, res) => {
    try {
        const reports = await reportModel.getAllReports();

        return res.status(200).json({
            success: true,
            message: 'Business reports retrieved successfully.',
            data: reports
        });

    } catch (error) {
        console.error('Get reports error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while generating business reports.'
        });
    }
};


module.exports = {
    getAllReports
};
