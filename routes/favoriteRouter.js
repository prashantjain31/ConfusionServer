const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
	Favorites.findOne({user: req.user._id})
	.populate('user')
	.populate('dishes')
	.then((favorites) => {
		if (favorites != null) {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(favorites);
		}
		else {
			err = new Error('There are no favourites!');
			err.status = 404;
			return next(err);
		}
	}, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
	Favorites.findOne({user: req.user._id})
    .then((favorites)=> {
        if(favorites!=null){
            for(let j of req.body){
                var alreadyExists=false;
                for(var i = (favorites.dishes.length -1); i >= 0; i--){
                    if(favorites.dishes[i].toString() === j._id.toString()){
                        alreadyExists=true;
                    }
                }
                if(alreadyExists){
                    continue;
                }
                else{
                    favorites.dishes.push(j._id);
                }
            }
            favorites.save()
            .then((favorites) => {
                Favorites.findOne({user:req.user._id})
                .then((favorites)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                })
            },(err)=>next(err));
        }
        else{
            Favorites.create({user:req.user._id})
            .then((favorites)=>{
                for(let i of req.body){
                    favorites.dishes.push(i._id)
                }
                favorites.save()
                .then((favorites)=>{
                    Favorites.findOne({user:req.user._id})
                    .then((favorites)=>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    })
                },(err)=>next(err))
            },(err)=>next(err))
        }
    },(err) => next(err))
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    Favorites.findOneAndDelete({user:req.user._id})
    .then((resp) => {
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    },(err)=>next(err))
    .catch(err=>next(err));
})

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req,res)=>{res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next)=>{
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if(favorites!=null){
            for(var i = (favorites.dishes.length -1); i >= 0; i--){
                if(favorites.dishes[i].toString() === req.params.dishId.toString()){
                    var err = new Error("Dish already in Your Favorites!")
                    return next(err);
                }
            }
            favorites.dishes.push(req.params.dishId)
            favorites.save()
            .then((favorites)=>{
                Favorites.findOne({user: req.user._id})
                .then((favorites)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                })
            },(err)=>next(err));
        }
        else{
            Favorites.create({user:req.user._id})
            .then((favorites) => {
                favorites.dishes.push(req.params.dishId)
                favorites.save()
                .then((favorites)=>{
                    Favorites.findOne({user:req.user._id})
                    .then((favorites)=>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    })
                },(err)=>next(err))
            },(err)=>next(err))
        }
    },(err)=>next(err))
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next)=>{
    Favorites.findOne({user:req.user._id})
    .then((favorites)=>{
        if(favorites!=null){
            for(var i = (favorites.dishes.length -1); i >= 0; i--){
                if(favorites.dishes[i].toString() === req.params.dishId.toString()){
                    favorites.dishes.splice(i,1);
                }
            }
            favorites.save()
            .then((favorites)=>{
                Favorites.findOne({user:req.user._id})
                    .then((favorites)=>{
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                })
            },err=>next(err))
        }
        else{
            var err=new Error("You dont have any favorites.");
            return next(err);
        }
    },err=>next(err))
    .catch(err=>next(err));
})

module.exports = favoriteRouter;