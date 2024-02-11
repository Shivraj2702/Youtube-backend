import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {userId} = req.params

try {
        const channelStats = await Video.aggregate([
            {
                $match: {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: { ifNull : ["likes" , []]},
                    }
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: 'owner',
                    foreignField: 'channel',
                    as: 'subscriber'
                }
            },
            {
                $addFields: {
                    subscriber : { $size : { ifNull : ["$subscriber" ,[] ] } }
                }
            },
            {
                $group : {
                    _id: null, 
                    totalViews : { $sum : "$views"},
                    totalVideo : { $sum : 1},
                    totalLikes : { $sum : "$likes"},
                    totalSubscriber: { $sum : "$subscriber"}
                }
            },
            {
                $project: {
                  _id: 0,
                  owner: 0,
                },
            },
            
        ])
        return res.status(200).json(new ApiResponse(200, { channelStats }, "Success"));
    } catch (e) {
      throw new ApiError(400, e.message);
    }


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { userId } = req.params

    try {
     const ChannelVideo = await Video.find({owner : new mongoose.Types.ObjectId(userId)}).count();
 
     if(!ChannelVideo) {
         throw new ApiError(401, "video not found")
     }
 
     return res.status(200).json(new ApiResponse(200 , {ChannelVideo}) , "video fetchted  successfully")
       }    catch (error) {
      throw new ApiError(500 , " something went wrong")
     }
})

export {
    getChannelStats, 
    getChannelVideos
    }