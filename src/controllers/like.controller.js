import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const {videoId} = req.params
    const {userId} = req.params
    
    if(!isValidObjectId(videoId)) {
        throw new ApiError(401 , "video is not valid")
    }

    const likedVideos = await Like.findOne({videoId , userId})

    let like
    let unlike

    if(likedVideos){
        unlike = await Like.deleteOne({ video : videoId})
    } else {
        like = await Like.create({
            video: videoId,
            likeBy : userId
        })
    }

    return res.status(200).json(new ApiResponse(200, like[0]?.likedVideos || [], "Fetched liked videos successfully!!"));

})

const toggleCommentLike = asyncHandler(async (req, res) => {
     //TODO: toggle like on comment
    const {commentId} = req.params
   
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400 , "commentId invalid")
    }

    const commentLike = await Comment.findOne({ comment : commentId})

    let like;
    let unlike;

    if(commentLike){
        unlike = await Comment.deleteOne({ comment : commentId})
    } else {
        like = await Comment.create({
            video: commentId,
            likeBy: req.user._id
        })
    }

    return res.status(200).json( new ApiResponse( 200 , {}, `User ${like? "like": "Unlike"} video successfully !!`))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400 , "tweetId invalid")
    }

    const tweetLike = await Tweet.findOne({ tweet : tweetId})

    let like;
    let unlike;

    if(tweetLike){
        unlike = await Tweet.deleteOne({ tweet : tweetId})
    } else {
        like = await Tweet.create({
            tweet: tweetId,
            likeBy: req.user._id
        })
    }

    return res.status(200).json( new ApiResponse( 200 , {}, `User ${like? "like": "Unlike"} video successfully !!`))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "This user id is not valid")
    }

    // find user in database 
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const likes = await Like.aggregate([

        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            videoOwner:{
                                $arrayElemAt: ["$videoOwner" , 0]
                            }
                        }
                    }
                ]
            }
        },

    ]) 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likes[2].likedVideos,
            "fetched Liked videos successfully !!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}