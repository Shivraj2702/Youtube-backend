import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
   
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400 , "channel id invalid")
    }

try {
        const userId= req.user?._id
    
        const credential = {subscriber:userId,channel:channelId};
    
        const subscribed = await Subscription.findOne(credential)
    
        if(!subscribed) {
            const newSubcriber = await Subscription.create(credential)
    
            if(!newSubcriber) {
                throw new ApiError(401, "unable to subscribe")
            }
    
            return res.status(200).json( new ApiResponse(201, newSubcriber, "channel subscriber successfully"))
        } 
        else {
            const unSubcribe = await Subscription.deleteOne(credential)
    
            if(!unSubcribe) {
                throw new ApiError(401, "unable to unsubscribe")
            }
    
            return res.status(200).json( new ApiResponse(201, newSubcriber, "channel subscriber successfully"))
        }
} catch (error) {
    throw new ApiError(500, error.message || "Internal server error while subscribing ")
}

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {


    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(401, "subscriber id invalid")
    }

    const channelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $project:{
                subscribers:{
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        },
    ])

    if(!channelSubscribers) {
        throw new ApiError(400 , "unable to find subscribers")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channelSubscribers[0],
            "All user channel Subscribes fetched Successfull!!"
        )
    )
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(401, "subscriber id invalid");
    }

    const subscriberCount = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(subscriberId),
    });

    if(!subscriberCount) {
        throw new ApiError(401, "subscriber not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscriberCount },
            "Number of subscribers fetched successfully!"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
