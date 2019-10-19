'use strict';
const Telegraf = require('telegraf');
const request = require('request-promise-native');
const fs = require('fs');
const mongoose = require('mongoose'),
  User = mongoose.model('Users');

const BOT = new Telegraf(process.env.BOT_TOKEN);
const AZURE_FACE_KEY = process.env.AZURE_FACE_KEY;
const AZURE_FACE_ENDPOINT = process.env.AZURE_FACE_ENDPOINT;

//mia chat telegram "505457149";
//mio _id: 5d829d3751a5222f9c7a7215

exports.healthcheck = (req, res) => {
    res.send({
        "message":"ok"
    });
};

exports.list_all_users = (req, res) => {
    User.find({},(err, users) => {
        if (err)
            res.status(500).send(err);
        res.status(200).json(users);
    });
}

exports.create_a_user = (req, res) => {
    var newUser = new User(req.body);
    newUser.save(async (err, user) => {
        try{
            if (err)
                throw new Error(err);
            await createFaceList(user._id);
            res.status(200).json(user);
        }catch(error){
            res.status(500).send(error);
        }
    });
}

exports.read_a_user = (req, res) => {
    User.findById(req.params.userId, (err, user) => {
        if (err)
            res.status(500).send(err);
        res.status(200).json(user);
    });
}

exports.update_a_user = (req, res) => {
    User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true}, (err, user) => {
        if (err)
            res.status(500).send(err);
        res.status(200).json(user);
    });
}

exports.delete_a_user = (req, res) => {
    User.deleteOne({
        _id: req.params.userId
    }, (err, user) => {
        if(err)
            res.status(500).send(err);
        res.status(200).send({message: `User ${req.params.userId} deleted`});
    });
}

exports.list_people = (req, res) => {
    User.findById({_id: req.params.userId}, (err, user) => {
        if (err)
            res.status(500).send(err);
        res.status(200).json(user.people);
    });
}

exports.create_a_person = async (req, res) => {
    try{
        let facePersistentId = await getFacePersistentId(req);
    }catch(err){
        res.status(500).send(err);
    }
}

exports.update_a_person = (req, res) => {
    
}

exports.delete_a_person = (req, res) => {
    
}

/*****UTILITY FUNCTIONS*****/
var getFaceId = async (req) => {
    return new Promise((resolve,reject) => {
        try{
            if(!req.files) {
                throw new Error({"error":"No image uploaded"});
            }
            let photo = req.files.photo;
            let imgPath = './tmp/' + photo.name;
            photo.mv(imgPath, async (err) => {
                if(err){
                    throw new Error(err);
                }else{
                    const imageBuffer = fs.readFileSync(imgPath);
                    const params = {
                        'returnFaceId': 'true',
                        'returnFaceLandmarks': 'false',
                        'returnFaceAttributes': 'age'
                    };
                    const options = {
                        uri: `${AZURE_FACE_ENDPOINT}/detect`,
                        qs: params,
                        body: imageBuffer,
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Ocp-Apim-Subscription-Key' : AZURE_FACE_KEY
                        }
                    };
                    let body = await request.post(options);
                    let JBody = JSON.parse(body);
                    resolve(JBody[0].faceId);
                }
            });
        }catch(error){
            reject(error);
        }
    });
}

var getFacePersistentId = async (req) => {
    return new Promise((resolve,reject) => {
        try{
            if(!req.files) {
                throw new Error({"error":"No image uploaded"});
            }
            let photo = req.files.photo;
            let imgPath = './tmp/' + photo.name;
            photo.mv(imgPath, async (err) => {
                if(err){
                    throw new Error(err);
                }else{
                    const imageBuffer = fs.readFileSync(imgPath);
                    let options = {
                        uri: `${process.env.AZURE_ENDPOINT}/facelists/${req.body._id}/persistedFaces`,
                        body: imageBuffer,
                        headers: {
                            'Content-Type': 'application/json',
                            'Ocp-Apim-Subscription-Key' : AZURE_FACE_KEY
                        }
                    };
                    let body = await request.post(options);
                    let JBody = JSON.parse(body);
                    resolve(JBody[0].persistedFaceId);
                }
            });
        }catch(error){
            reject(error);
        }
    });
    return new Promise((resolve, reject) => {
        
    });
}

var createFaceList = async (id) => {
    return new Promise((resolve,reject) => {
        let options = {
            method: 'PUT',
            url: `${process.env.AZURE_ENDPOINT}/facelists/${id}`,
            body: `{"name": "${id}"}`,
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : AZURE_FACE_KEY
            }
        };
        try{
            await request(options);
        }catch(error){
            reject(error);
        }
    })
    
}



/*
exports.checkPersonInPhoto = function(req,res){
    try {
        if(!req.files) {
            throw new Error({"error":"No image uploaded"});
        }
        let photo = req.files.photo;
        let imgPath = './tmp/' + photo.name;
        photo.mv(imgPath, (err) => {
            if(err){
                throw new Error(err);
            }else{
                const imageBuffer = fs.readFileSync(imgPath);
                const params = {
                    'returnFaceId': 'true',
                    'returnFaceLandmarks': 'false',
                    'returnFaceAttributes': 'age'
                };
                
                const options = {
                    uri: `${AZURE_FACE_ENDPOINT}/detect`,
                    qs: params,
                    body: imageBuffer,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key' : AZURE_FACE_KEY
                    }
                };
                
                request.post(options, (err, response, body) => {
                    if (err) {
                        throw new Error(err);
                    }
                    let jsonResponse = JSON.parse(body);
                    if(jsonResponse.length == 0){
                        BOT.telegram.sendMessage(CHAT_ID,"Not recognizable person found, here is a photo:");
                        BOT.telegram.sendPhoto(CHAT_ID, {
                            source: fs.readFileSync(imgPath)
                        });    
                    }else{
                        BOT.telegram.sendMessage(CHAT_ID,"I found a person:");
                        BOT.telegram.sendPhoto(CHAT_ID,{
                            source: fs.readFileSync(imgPath)
                        });
                    }
                    res.send(jsonResponse);
                    fs.unlinkSync(imgPath);
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}
*/
BOT.launch();