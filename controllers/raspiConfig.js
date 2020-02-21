const RaspiConfig = require('../models/raspiConfig');
const request = require('request-promise-native');

module.exports.getRaspiConfig = (req, res, next) => {
    const raspiId = req.params.raspiId;
    RaspiConfig.findOne({ raspiId: raspiId })
        .then(raspiConfig => {
            if (raspiConfig) {
                res.status(201).json(raspiConfig);
            } else {
                throw new Error(`RaspiConfig not found; RaspiId ${raspiId} doesn't exists`);
            }
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}
module.exports.updateRaspiConfig = (req, res, next) => {
    const raspiId = req.params.raspiId;
    if (!raspiId) {
        throw new Error(`Could not update the raspi, raspiId not found.`);
    }
    let raspiConfig;
    RaspiConfig.findOne({ raspiId: raspiId })
        .then(result => {
            let resolution = req.body.resolution;
            let confidence = req.body.confidence;
            if (!resolution || !confidence) {
                throw new Error(`Could not update the raspi: ${raspiId}, confidence or resolution not found.`);
            }
            result.confidence = confidence;
            result.resolution = resolution;
            raspiConfig = result;
            return request(
                {
                    url: `${process.env.WS_CONTROLLER_URL}/raspi/${raspiId}`,
                    method: "POST",
                    json: {
                        resolution: resolution,
                        confidence: confidence,
                        raspiId: raspiId
                    }
                }
            );
        })
        .then(result => {
            if (result.error) {
                throw new Error('Could not update raspiId');
            }
            return raspiConfig.save();
        })
        .then(result => {
            res.status(201).json({ message: "RaspiConfig Updated!", raspiConfig });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}