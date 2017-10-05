const axios = require('axios');
const config = require('../config/default');
const db = require('../models');

// const Article = require('../models/article')(db.sequelize, db.Sequelize.DataTypes);
// const Summary = require('../models/summary')(db.sequelize, db.Sequelize.DataTypes);
// const Grade = require('../models/grade')(db.sequelize, db.Sequelize.DataTypes);

/**
 * Execute summarization
 * @param req
 * @param res
 */
exports.summarize = (req, res) => {
    if (req.body.article.length > config.summary.minCharacter) {
         axios.post(config.api.host, { article: req.body.article }).then(result => {
             console.log('article summarized');
             res.json({ summary: result.data.resp_resume, chrono: result.data.chrono });
         }).catch(err => {
             console.log('an error has occured during summarization', err);
             res.sendStatus(500);
         });
        //res.json({chrono: 2, summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc eu massa interdum urna rutrum aliquam. Nam ultricies, ex nec pulvinar scelerisque, dui odio efficitur sapien, id volutpat lorem dui et felis. Vivamus dictum sagittis est, sed placerat odio congue venenatis.'})
    } else {
        res.status(400).json({ message: 'The text must be at least '+ config.summary.minCharacter +' characters.' });
    }
};

/**
 * Add a summary to the database
 * @param req
 * @param res
 */
exports.store = (req, res) => {
    const body = req.body;
    let summaries = [{
        content: body.summary.content, is_generated: true, Grades: [{
            grade: body.summary.grade, is_incorrect: !body.summary.isAccepted
        }]
    }];
    // Push the user version if he edited
    if (parseInt(req.query.edited)) {
        summaries.push({
            content: body.summary.userVersion, is_generated: false
        });
    }
    // Add the article
    db.Article.create({
        fullText: body.article.fullText, origin: null, Summaries: summaries
    }, {
        include: {
            association: db.Article.Summaries, // Association with the summaries
            include: [db.Summary.Grades] // And the grades
        }
    }).then(() => {
        res.status(200).json({ success: true });
    }).catch((err) => {
        switch (err.name) {
            case 'SequelizeValidationError':
                res.status(400).json({ message: 'The article or summary is not correct (article at least 500 characters).' });
                break;
            default:
                res.status(500).json({ message: 'An error has occurred, please try again.' });
                break;
        }
    });
};
